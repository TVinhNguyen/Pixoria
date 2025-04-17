import torch
import clip
import numpy as np
import json
import faiss
from PIL import Image
import requests
from io import BytesIO
import os
import django
import sys

# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webImage.settings')  # Tên ứng dụng.settings của bạn
# django.setup()
from django.conf import settings

INDEX_DIR = settings.INDEX_CLIP_DIR
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'


# Define the index directory

# INDEX_DIR = r".\mediafiles\clip_index"

class CLIPImageSearch:
    def __init__(self):
        # Load CLIP model
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load("ViT-B/32", self.device)
        
        # Load data and FAISS index
        self.load_data()
        
    def load_data(self):
        """Load FAISS index, embeddings and image metadata"""
        try:
            # Load FAISS index
            index_path = os.path.join(INDEX_DIR, 'clip_faiss.index')
            self.faiss_index = faiss.read_index(index_path)
            print(f"Loaded FAISS index with {self.faiss_index.ntotal} vectors")
            
            # Load image URLs and IDs for reference
            with open(os.path.join(INDEX_DIR, 'image_urls.json'), 'r') as f:
                self.image_urls = json.load(f)
                
            with open(os.path.join(INDEX_DIR, 'image_ids.json'), 'r') as f:
                self.image_ids = json.load(f)
            
            # Load full metadata for detailed results
            with open(os.path.join(INDEX_DIR, 'image_metadata.json'), 'r') as f:
                self.image_metadata = json.load(f)
            
            # Create a lookup dictionary for faster access
            self.metadata_by_id = {item['id']: item for item in self.image_metadata}
            
            print(f"Loaded metadata for {len(self.image_urls)} images")
            
            # As a backup, also load the numpy embeddings if needed
            embedding_path = os.path.join(INDEX_DIR, 'clip_image_embeddings.npy')
            if os.path.exists(embedding_path):
                self.image_embeddings = np.load(embedding_path)
            else:
                print("Warning: Numpy embeddings file not found")
                
        except Exception as e:
            print(f"Error loading data: {e}")
            raise
    
    def search(self, query_text, top_k=12):
        """Search images using a text query with FAISS"""
        # Encode the query text
        with torch.no_grad():
            text = clip.tokenize([query_text]).to(self.device)
            text_features = self.model.encode_text(text)
            text_features /= text_features.norm(dim=-1, keepdim=True)
        
        # Convert to numpy and correct shape
        query_vector = text_features.cpu().numpy().astype('float32').reshape(1, -1)
        
        # Search using FAISS
        distances, indices = self.faiss_index.search(query_vector, top_k)
        
        # Prepare results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(self.image_ids):
                # This can happen if FAISS doesn't find enough matches
                continue
                
            image_id = self.image_ids[idx]
            # Convert distance to similarity score (lower distance = higher similarity)
            # For normalized vectors, we can convert L2 distance to cosine similarity
            distance = float(distances[0][i])
            similarity_score = 1.0 / (1.0 + distance)  # Transform to a 0-1 scale
            
            # Get full metadata if available
            metadata = self.metadata_by_id.get(image_id, {})
            if not metadata:
                # Fallback if metadata is not available
                metadata = {
                    'id': image_id,
                    'file': self.image_urls[idx]
                }
            
            # Add similarity score
            metadata['similarity_score'] = similarity_score
            
            results.append(metadata)
        
        # Sort by similarity score (highest first)
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return results

    def search_by_image(self, image_path_or_url, top_k=12):
        """Search similar images using an image URL or local file path"""
        try:
            # Phân biệt URL và local path
            if os.path.exists(image_path_or_url):
                # Nếu là file local
                img = Image.open(image_path_or_url).convert('RGB')
            elif image_path_or_url.startswith('http'):
                # Nếu là URL
                response = requests.get(image_path_or_url, stream=True)
                img = Image.open(BytesIO(response.content)).convert('RGB')
            else:
                raise ValueError(f"Không thể xử lý: {image_path_or_url}")

            # Generate embedding
            image_input = self.preprocess(img).unsqueeze(0).to(self.device)

            with torch.no_grad():
                image_features = self.model.encode_image(image_input)
                image_features /= image_features.norm(dim=-1, keepdim=True)

            # Convert to numpy and reshape
            query_vector = image_features.cpu().numpy().astype('float32').reshape(1, -1)

            # Search using FAISS
            distances, indices = self.faiss_index.search(query_vector, top_k)

            # Prepare results
            results = []
            for i, idx in enumerate(indices[0]):
                if idx < 0 or idx >= len(self.image_ids):
                    continue

                image_id = self.image_ids[idx]
                distance = float(distances[0][i])
                similarity_score = 1.0 / (1.0 + distance)

                metadata = self.metadata_by_id.get(image_id, {})
                if not metadata:
                    metadata = {
                        'id': image_id,
                        'file': self.image_urls[idx]
                    }

                metadata['similarity_score'] = similarity_score
                results.append(metadata)

            # Sort by similarity score (highest first)
            results.sort(key=lambda x: x['similarity_score'], reverse=True)

            return results

        except Exception as e:
            print(f"Error in image search: {e}")
            return []
    # Example usage
if __name__ == "__main__":
    search_engine = CLIPImageSearch()
    
    # Example text queries
    queries = [
        "beautiful sunset over mountains",
        "modern technology devices",
        "people smiling at the camera",
        "architectural buildings in the city"
    ]
    
    for query in queries:
        print(f"\nSearch results for: '{query}'")
        results = search_engine.search(query, top_k=5)
        for i, result in enumerate(results):
            print(f"{i+1}. ID: {result['id']} - Score: {result['similarity_score']:.4f}")
            print(f"   Title: {result.get('title', 'No title')}")
            print(f"   URL: {result['file']}")
            if 'categories' in result:
                categories = [cat['name'] for cat in result['categories']]
                print(f"   Categories: {', '.join(categories)}")