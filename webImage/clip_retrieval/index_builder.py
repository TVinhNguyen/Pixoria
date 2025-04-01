import os
import json
import faiss
import numpy as np
import pickle
from tqdm import tqdm
import requests
from PIL import Image
from io import BytesIO
import torch
import clip
from typing import List, Dict, Union, Tuple, Any, Optional

class TextImageFeatureExtractor:
    """
    A class for extracting features from images and text using the CLIP ViT-B/32 model.
    This enables text-to-image and image-to-image search capabilities.
    """
    def __init__(self, use_gpu: bool = True):
        """
        Initialize the feature extractor with CLIP ViT-B/32 model.
        
        Args:
            use_gpu (bool): Whether to use GPU for computation if available.
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() and use_gpu else "cpu")
        print(f"Using device: {self.device}")

        # Load CLIP ViT-B/32 model
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        print(f"Loaded CLIP ViT-B/32 model")
        self.model.eval()
        
        # Get feature dimension from model
        self.feature_dim = self.model.visual.output_dim  # 512 for ViT-B/32
        
    def load_image(self, image_source: str) -> Optional[Image.Image]:
        """
        Load image from URL or local path.
        
        Args:
            image_source (str): URL or local path of the image.
        
        Returns:
            Optional[PIL.Image]: Loaded image or None if failed.
        """
        try:
            if image_source.startswith("http"):  # Load from URL
                response = requests.get(image_source, timeout=10)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content)).convert("RGB")
            else:  # Load from local path
                image = Image.open(image_source).convert("RGB")
            return image
        except Exception as e:
            print(f"❌ Error loading image {image_source}: {e}")
            return None
            
    def extract_image_features(self, image_source: str) -> Optional[np.ndarray]:
        """
        Extract image features using CLIP ViT-B/32.
        
        Args:
            image_source (str): URL or local path of the image.
            
        Returns:
            Optional[np.ndarray]: Feature vector or None if failed.
        """
        image = self.load_image(image_source)
        if image is None:
            return None
        
        # Preprocess and extract features
        image = self.preprocess(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            features = self.model.encode_image(image)
            # Normalize features (important for CLIP)
            features = features / features.norm(dim=-1, keepdim=True)
            
        return features.cpu().numpy()
    
    def extract_text_features(self, text: str) -> np.ndarray:
        """
        Extract text features using CLIP ViT-B/32.
        
        Args:
            text (str): Input text to encode.
            
        Returns:
            np.ndarray: Feature vector for the text.
        """
        # Tokenize and encode text
        text_tokens = clip.tokenize([text]).to(self.device)
        with torch.no_grad():
            features = self.model.encode_text(text_tokens)
            # Normalize features (important for CLIP)
            features = features / features.norm(dim=-1, keepdim=True)
            
        return features.cpu().numpy()
        
    def extract_features_batch(self, image_sources: List[str], batch_size: int = 32) -> Tuple[np.ndarray, List[int]]:
        """
        Extract features from a batch of images.
        
        Args:
            image_sources (list): List of image URLs or paths.
            batch_size (int): Batch size for processing.
            
        Returns:
            tuple: (features, valid_indices) - Feature matrix and valid indices
        """
        num_images = len(image_sources)
        all_features = []
        valid_indices = []

        for i in range(0, num_images, batch_size):
            batch_sources = image_sources[i:i+batch_size]
            batch_images = []
            batch_valid_indices = []
            
            # Load and preprocess images in batch
            for j, src in enumerate(batch_sources):
                img = self.load_image(src)
                if img is not None:
                    batch_images.append(self.preprocess(img))
                    batch_valid_indices.append(i + j)
            
            # Skip if no valid images in batch
            if not batch_images:
                continue
                
            # Process batch of valid images
            batch_tensor = torch.stack(batch_images).to(self.device)
            with torch.no_grad():
                batch_features = self.model.encode_image(batch_tensor)
                # Normalize features
                batch_features = batch_features / batch_features.norm(dim=-1, keepdim=True)
                batch_features = batch_features.cpu().numpy()
                
            all_features.append(batch_features)
            valid_indices.extend(batch_valid_indices)
            print(f"✅ Processed {min(i + batch_size, num_images)}/{num_images} images")

        # Combine features from all batches
        if all_features:
            combined_features = np.vstack(all_features)
            return combined_features, valid_indices
        else:
            return np.array([]), []

    def extract_features_from_s3_data(self, image_data: Union[List[Dict], List[str]], batch_size: int = 32) -> Tuple[np.ndarray, List[Any]]:
        """
        Extract features from S3 data in JSON format.
        
        Args:
            image_data (list): List of dict containing image info from S3 or list of URLs
            batch_size (int): Batch size
            
        Returns:
            tuple: (features, valid_images) - Feature matrix and valid image info
        """
        # Check if image_data is a list of URL strings or a list of dicts
        if image_data and isinstance(image_data[0], str):
            image_urls = image_data  # Already a list of URLs
            is_dict_data = False
        else:
            try:
                image_urls = [item["file"] for item in image_data]
                is_dict_data = True
            except (TypeError, KeyError) as e:
                print(f"❌ Error: Invalid data format: {e}")
                print("First sample data structure:", image_data[0] if image_data else None)
                return np.array([]), []
        
        features, valid_indices = self.extract_features_batch(image_urls, batch_size)
        
        # Filter valid images
        if is_dict_data:
            valid_images = [image_data[i] for i in valid_indices]
        else:
            valid_images = [image_urls[i] for i in valid_indices]
        
        return features, valid_images


class IndexBuilder:
    """
    A class to build and manage FAISS index for text-to-image and image-to-image search.
    """
    def __init__(self, use_gpu: bool = True):
        """
        Initialize the IndexBuilder with CLIP ViT-B/32 model.
        
        Args:
            use_gpu (bool): Whether to use GPU for computation if available.
        """
        self.use_gpu = use_gpu
        self.extractor = TextImageFeatureExtractor(use_gpu=use_gpu)
        self.feature_dim = self.extractor.feature_dim  # 512 for ViT-B/32
        self.image_data = []  # Store image information

        # Initialize FAISS index with cosine similarity (since CLIP features are normalized)
        self.index = faiss.IndexFlatIP(self.feature_dim)  # Inner product = cosine similarity for normalized vectors

        # Move index to GPU if available
        if use_gpu and faiss.get_num_gpus() > 0:
            print(f"🚀 Using FAISS GPU (gpus available: {faiss.get_num_gpus()})")
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)
        else:
            print("🖥️ Using FAISS CPU")

    def load_s3_data(self, json_file: Optional[str] = None, api_url: Optional[str] = None, total_pages: Optional[int] = None) -> List[Any]:
        """
        Load image data from JSON file or API.
        
        Args:
            json_file (str): Path to JSON file containing image info.
            api_url (str): Base API URL to fetch image info.
            total_pages (int): Total number of pages (if known).
            
        Returns:
            list: List of image information.
        """
        if json_file:
            with open(json_file, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict) and "results" in data:
                    self.image_data = data["results"]
                else:
                    self.image_data = data
        elif api_url:
            base_url = api_url.split('?')[0] if '?' in api_url else api_url
            base_url = base_url.rstrip('/')
            
            if total_pages is None:
                # Get first page to check total pages
                response = requests.get(f"{base_url}/?page=1")
                response.raise_for_status()
                
                try:
                    data = response.json()
                    
                    # Check response data structure
                    print(f"Checking API response data structure: {type(data)}")
                    if isinstance(data, list):
                        # API returns list of items directly
                        page_data = data
                        print(f"API returned list with {len(page_data)} items")
                        if page_data and isinstance(page_data[0], str):
                            print("Format: List of URL strings")
                        else:
                            print(f"First data sample: {page_data[0] if page_data else None}")
                    elif isinstance(data, dict) and "results" in data:
                        page_data = data["results"]
                        total_count = data.get("count", 0)
                        print(f"Total images: {total_count}")
                    else:
                        page_data = [data]  # Put in list if not matching expected format
                    
                    self.image_data.extend(page_data)
                    print(f"📄 Loaded page 1 with {len(page_data)} items")
                    
                    # If API returns paginated format
                    next_url = data.get("next") if isinstance(data, dict) else None
                    page = 2
                    
                    while next_url:
                        try:
                            response = requests.get(next_url)
                            response.raise_for_status()
                            
                            data = response.json()
                            if isinstance(data, dict) and "results" in data:
                                page_data = data["results"]
                                next_url = data.get("next")
                            else:
                                page_data = data if isinstance(data, list) else [data]
                                next_url = None
                            
                            if not page_data:  # Stop if no data
                                break
                                
                            self.image_data.extend(page_data)
                            print(f"📄 Loaded page {page} with {len(page_data)} items")
                            page += 1
                        except Exception as e:
                            print(f"❌ Error loading page {page}: {e}")
                            break
                
                except Exception as e:
                    print(f"❌ Error parsing API response: {e}")
                    # Try processing as text
                    try:
                        text_data = response.text
                        lines = [line.strip() for line in text_data.split('\n') if line.strip()]
                        print(f"API returned {len(lines)} lines of text")
                        self.image_data = lines
                    except Exception as text_e:
                        print(f"❌ Cannot process response as text: {text_e}")
            
            else:
                # If total_pages is known, use tqdm to track progress
                for page in tqdm(range(1, total_pages + 1), desc="Loading data"):
                    try:
                        response = requests.get(f"{base_url}/?page={page}")
                        response.raise_for_status()
                        
                        try:
                            data = response.json()
                            if isinstance(data, list):
                                page_data = data
                            elif isinstance(data, dict) and "results" in data:
                                page_data = data["results"]
                            else:
                                page_data = [data]
                                    
                            self.image_data.extend(page_data)
                            
                        except Exception as e:
                            print(f"❌ Error parsing API response on page {page}: {e}")
                            # Try processing as text
                            try:
                                text_data = response.text
                                lines = [line.strip() for line in text_data.split('\n') if line.strip()]
                                self.image_data.extend(lines)
                            except Exception as text_e:
                                print(f"❌ Cannot process response as text: {text_e}")
                                
                    except Exception as e:
                        print(f"❌ Error loading page {page}: {e}")
        
        else:
            raise ValueError("Must provide json_file or api_url")
            
        print(f"📸 Loaded {len(self.image_data)} items total")
        
        # Check and print sample data
        if self.image_data:
            print("Sample data:")
            for i in range(min(3, len(self.image_data))):
                print(f"  - {self.image_data[i]}")
        
        return self.image_data

    def build_index_from_s3(self, json_file=None, api_url=None, total_pages=None, batch_size=32):
        """
        Build FAISS index from S3 image data.
        
        Args:
            json_file (str): Path to JSON file containing image info.
            api_url (str): API URL to fetch image info.
            total_pages (int): Total number of pages (if known).
            batch_size (int): Batch size for processing images.
        """
        # Load image data
        self.load_s3_data(json_file, api_url, total_pages)
        print("🔍 Extracting features...")

        # Extract features
        features, valid_images = self.extractor.extract_features_from_s3_data(self.image_data, batch_size)
        
        # Update image list with only valid images
        self.image_data = valid_images
        
        if len(features) > 0:
            print("⚡ Adding features to FAISS index...")
            self.index.add(features)
            print(f"✅ Index built with {self.index.ntotal} images")
        else:
            print("❌ No valid images found. Index not built.")

    def save(self, index_path, mapping_path):
        """
        Save FAISS index and mapping to files.
        
        Args:
            index_path (str): Path to save FAISS index.
            mapping_path (str): Path to save mapping.
        """
        if self.use_gpu and faiss.get_num_gpus() > 0:
            faiss.write_index(faiss.index_gpu_to_cpu(self.index), str(index_path))
        else:
            index_path = str(index_path)
            faiss.write_index(self.index, index_path)

        with open(mapping_path, 'wb') as f:
            pickle.dump(self.image_data, f)

        print(f"💾 Index saved to {index_path}")
        print(f"📝 Image mapping saved to {mapping_path}")

    def load(self, index_path, mapping_path):
        """
        Load FAISS index and mapping from files.
        
        Args:
            index_path (str): Path to FAISS index file.
            mapping_path (str): Path to mapping file.
        """
        self.index = faiss.read_index(str(index_path))

        if self.use_gpu and faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)

        with open(mapping_path, 'rb') as f:
            self.image_data = pickle.load(f)

        print(f"✅ Loaded index with {self.index.ntotal} vectors")
        print(f"📂 Loaded {len(self.image_data)} image records")

    def search_by_image(self, query_image, top_k=5):
        """
        Search for similar images using an image query.
        
        Args:
            query_image (str): URL or path to query image.
            top_k (int): Number of results to return.
            
        Returns:
            list: List of dicts containing similar image info and similarity scores.
        """
        # Extract features from query image
        query_feature = self.extractor.extract_image_features(query_image)
        if query_feature is None:
            return []
            
        # Search for similar images
        similarities, indices = self.index.search(query_feature, top_k)
        
        # Create results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.image_data) and idx >= 0:  # Check valid index
                # Handle both dict and string cases
                if isinstance(self.image_data[idx], dict):
                    result = self.image_data[idx].copy()  # Copy to avoid modifying original data
                    result["similarity"] = float(similarities[0][i])
                else:
                    # If not dict (possibly string), create new dict
                    image_data = self.image_data[idx]
                    result = {
                        "id": idx,  # Use index as id if none available
                        "file": image_data if isinstance(image_data, str) else str(image_data),
                        "similarity": float(similarities[0][i])
                    }
                results.append(result)
                
        return results
    
    def search_by_text(self, query_text, top_k=5):
        """
        Search for images using a text query.
        
        Args:
            query_text (str): Text query to search for.
            top_k (int): Number of results to return.
            
        Returns:
            list: List of dicts containing similar image info and similarity scores.
        """
        # Extract features from query text
        query_feature = self.extractor.extract_text_features(query_text)
            
        # Search for similar images
        similarities, indices = self.index.search(query_feature, top_k)
        
        # Create results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.image_data) and idx >= 0:  # Check valid index
                # Handle both dict and string cases
                if isinstance(self.image_data[idx], dict):
                    result = self.image_data[idx].copy()  # Copy to avoid modifying original data
                    result["similarity"] = float(similarities[0][i])
                else:
                    # If not dict (possibly string), create new dict
                    image_data = self.image_data[idx]
                    result = {
                        "id": idx,  # Use index as id if none available
                        "file": image_data if isinstance(image_data, str) else str(image_data),
                        "similarity": float(similarities[0][i])
                    }
                results.append(result)
                
        return results