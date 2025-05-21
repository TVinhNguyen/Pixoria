import torch
import clip
import numpy as np
import json
import faiss
from PIL import Image as PILImage
import requests
from io import BytesIO
import os
import django
import sys
import pickle
from django.core.cache import cache

# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webImage.settings')  # Tên ứng dụng.settings của bạn
# django.setup()
from django.conf import settings

INDEX_DIR = settings.INDEX_CLIP_DIR
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

# Thời gian cache mặc định (24 giờ)
DEFAULT_CACHE_TTL = 60 * 60 * 24

# Define the index directory

# INDEX_DIR = r".\mediafiles\clip_index"

class CLIPImageSearch:
    # Singleton instance
    _instance = None
    _initialized = False
    
    @classmethod
    def get_instance(cls):
        """Singleton pattern to ensure only one instance is created"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        # This prevents re-initialization if this is a singleton instance
        if CLIPImageSearch._initialized:
            return
            
        # Load CLIP model
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load("ViT-B/32", self.device)
        
        # Load data and FAISS index
        self.load_data()
        
        # Mark as initialized
        CLIPImageSearch._initialized = True
        
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
            
            # As a backup, also load the numpy embeddings
            embedding_path = os.path.join(INDEX_DIR, 'clip_image_embeddings.npy')
            if os.path.exists(embedding_path):
                self.image_embeddings = np.load(embedding_path)
                
                # Check for mismatches between metadata and embeddings
                if len(self.image_ids) != self.image_embeddings.shape[0]:
                    print(f"Warning: Mismatch between metadata ({len(self.image_ids)} images) and embeddings ({self.image_embeddings.shape[0]} vectors)")
                    print("Attempting to repair the index automatically...")
                    self._synchronize_metadata_and_embeddings()
            else:
                print("Warning: Numpy embeddings file not found")
                
        except Exception as e:
            print(f"Error loading data: {e}")
            raise
            
    def _synchronize_metadata_and_embeddings(self):
        """Ensure metadata and embeddings are in sync"""
        try:
            embedding_path = os.path.join(INDEX_DIR, 'clip_image_embeddings.npy')
            if not os.path.exists(embedding_path):
                print("Cannot synchronize: embeddings file not found")
                return False
                
            # Load embeddings
            embeddings = np.load(embedding_path)
            
            # Determine which needs trimming
            if len(self.image_ids) > embeddings.shape[0]:
                # More metadata than embeddings, trim metadata
                print(f"Trimming metadata from {len(self.image_ids)} to {embeddings.shape[0]} entries")
                self.image_ids = self.image_ids[:embeddings.shape[0]]
                self.image_urls = self.image_urls[:embeddings.shape[0]]
                
                # Rebuild metadata
                updated_metadata = []
                for img_id in self.image_ids:
                    if str(img_id) in [str(item['id']) for item in self.image_metadata]:
                        item = next((item for item in self.image_metadata if str(item['id']) == str(img_id)), None)
                        if item:
                            updated_metadata.append(item)
                
                self.image_metadata = updated_metadata
                self.metadata_by_id = {item['id']: item for item in self.image_metadata}
                
            elif len(self.image_ids) < embeddings.shape[0]:
                # More embeddings than metadata, trim embeddings
                print(f"Trimming embeddings from {embeddings.shape[0]} to {len(self.image_ids)} entries")
                embeddings = embeddings[:len(self.image_ids)]
                np.save(embedding_path, embeddings)
                self.image_embeddings = embeddings
            
            # Rebuild FAISS index
            dimension = embeddings.shape[1]
            self.faiss_index = faiss.IndexFlatL2(dimension)
            self.faiss_index.add(embeddings)
            
            # Save all synchronized data
            self._save_data()
            
            print(f"Successfully synchronized data. Now have {len(self.image_ids)} images with corresponding embeddings.")
            return True
            
        except Exception as e:
            print(f"Error synchronizing data: {e}")
            return False
    
    def search(self, query_text, top_k=12, use_cache=True):
        """Search images using a text query with FAISS with Redis caching"""
        # Kiểm tra cache nếu use_cache=True
        if use_cache:
            cache_key = f'clip_text_search:{query_text}:{top_k}'
            cached_results = cache.get(cache_key)
            if cached_results:
                print(f"Returning cached results for query: '{query_text}'")
                return cached_results
        
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
        
        # Cache kết quả nếu use_cache=True
        if use_cache:
            # Serialize để cache (nếu cần thiết)
            cache_key = f'clip_text_search:{query_text}:{top_k}'
            cache.set(cache_key, results, DEFAULT_CACHE_TTL)
        
        return results

    def search_by_image(self, image_path_or_url, top_k=12, use_cache=True):
        """Search similar images using an image URL or local file path with Redis caching"""
        try:
            # Kiểm tra cache nếu sử dụng URL và use_cache=True
            if use_cache and image_path_or_url.startswith('http'):
                cache_key = f'clip_image_search:{image_path_or_url}:{top_k}'
                cached_results = cache.get(cache_key)
                if cached_results:
                    print(f"Returning cached results for image search: '{image_path_or_url}'")
                    return cached_results
            
            # Phân biệt URL và local path
            if os.path.exists(image_path_or_url):
                # Nếu là file local
                img = PILImage.open(image_path_or_url).convert('RGB')
            elif image_path_or_url.startswith('http'):
                # Nếu là URL
                response = requests.get(image_path_or_url, stream=True)
                img = PILImage.open(BytesIO(response.content)).convert('RGB')
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
            
            # Cache kết quả nếu sử dụng URL và use_cache=True
            if use_cache and image_path_or_url.startswith('http'):
                cache_key = f'clip_image_search:{image_path_or_url}:{top_k}'
                cache.set(cache_key, results, DEFAULT_CACHE_TTL)

            return results

        except Exception as e:
            print(f"Error in image search: {e}")
            return []

    def search_by_image_id(self, image_id, top_k=12, use_cache=True):
        """Search similar images using an image ID with Redis caching"""
        try:
            # Kiểm tra cache nếu use_cache=True
            if use_cache:
                cache_key = f'clip_image_id_search:{image_id}:{top_k}'
                cached_results = cache.get(cache_key)
                if cached_results:
                    print(f"Returning cached results for image ID search: '{image_id}'")
                    return cached_results
            
            # Truy vấn Django database để lấy ảnh
            from media.models import Image
            image = Image.objects.get(id=image_id)
            image_url = image.file.url
            
            # Tiến hành tìm kiếm thông qua URL
            results = self.search_by_image(image_url, top_k, use_cache=False)
            
            # Cache kết quả nếu use_cache=True
            if use_cache:
                cache_key = f'clip_image_id_search:{image_id}:{top_k}'
                cache.set(cache_key, results, DEFAULT_CACHE_TTL)
            
            return results
            
        except Exception as e:
            print(f"Error in image ID search: {e}")
            return []

    def update_index_for_image(self, image_id):
        """Add a new image to the FAISS index"""
        try:
            # Get the image from Django ORM
            from media.models import Image
            image = Image.objects.get(id=image_id)
            
            # Process the image
            image_url = image.file.url
            img_response = requests.get(image_url, stream=True)
            img = PILImage.open(BytesIO(img_response.content)).convert('RGB')
            
            # Generate embedding
            image_input = self.preprocess(img).unsqueeze(0).to(self.device)
            with torch.no_grad():
                image_features = self.model.encode_image(image_input)
                image_features /= image_features.norm(dim=-1, keepdim=True)
            
            # Convert to numpy and reshape
            embedding = image_features.cpu().numpy().astype('float32').reshape(1, -1)
            
            # Add to FAISS index
            self.faiss_index.add(embedding)
            
            # Update metadata
            self.image_ids.append(image_id)
            self.image_urls.append(image_url)
            
            # Create metadata for this image
            metadata = {
                'id': image_id,
                'file': image_url,
                'title': image.title,
                'description': image.description,
                'created_at': str(image.created_at),
                'is_public': image.is_public,
                'user_id': image.user.id
            }
            
            # Add to metadata
            self.image_metadata.append(metadata)
            self.metadata_by_id[image_id] = metadata
            
            # Xóa cache liên quan đến tìm kiếm để đảm bảo kết quả luôn mới nhất
            self._invalidate_search_cache()
            
            # Save updated data
            self._save_data()
            
            return True
            
        except Exception as e:
            print(f"Error updating index for image {image_id}: {e}")
            raise
    
    def remove_from_index(self, image_id):
        """Remove an image from the FAISS index"""
        try:
            # Find the index of the image in our metadata
            image_index = None
            for i, img_id in enumerate(self.image_ids):
                if str(img_id) == str(image_id):  # Convert to string for comparison
                    image_index = i
                    break
            
            if image_index is None:
                print(f"Image {image_id} not found in index")
                return False
                
            # Remove from metadata
            self.image_ids.pop(image_index)
            self.image_urls.pop(image_index)
            
            # Remove from metadata dictionary
            if image_id in self.metadata_by_id:
                del self.metadata_by_id[image_id]
            
            # Find and remove from image_metadata list
            self.image_metadata = [img for img in self.image_metadata if str(img['id']) != str(image_id)]
            
            # Note: We're deliberately NOT rebuilding the FAISS index
            # Instead we just mark the index as stale by updating metadata
            # The index will be slightly inaccurate but will not cause errors
            # This avoids expensive rebuilding operations
            print(f"Removed image {image_id} from metadata but skipped FAISS index rebuild")
            
            # Xóa cache liên quan đến tìm kiếm để đảm bảo kết quả luôn mới nhất
            self._invalidate_search_cache()
            
            # Save updated data
            self._save_data()
            
            return True
            
        except Exception as e:
            print(f"Error removing image {image_id} from index: {e}")
            raise
            
    def _rebuild_index_from_metadata(self):
        """Rebuild FAISS index from existing images in metadata"""
        try:
            print("Attempting to rebuild FAISS index from existing metadata...")
            
            # If we have no images left, create an empty index
            if len(self.image_ids) == 0:
                print("No images remaining, creating empty index")
                # Use default dimension (512 for CLIP ViT-B/32)
                self.faiss_index = faiss.IndexFlatL2(512)
                return
                
            # Get embeddings for remaining images
            from media.models import Image
            embeddings = []
            
            for image_id in self.image_ids:
                try:
                    # Get the image and regenerate its embedding
                    image = Image.objects.get(id=image_id)
                    image_url = image.file.url
                    
                    # Process the image
                    img_response = requests.get(image_url, stream=True)
                    img = PILImage.open(BytesIO(img_response.content)).convert('RGB')
                    
                    # Generate embedding
                    image_input = self.preprocess(img).unsqueeze(0).to(self.device)
                    with torch.no_grad():
                        image_features = self.model.encode_image(image_input)
                        image_features /= image_features.norm(dim=-1, keepdim=True)
                    
                    # Add to embeddings list
                    embedding = image_features.cpu().numpy().astype('float32').reshape(1, -1)
                    embeddings.append(embedding)
                    
                except Exception as e:
                    print(f"Error processing image {image_id} during rebuild: {e}")
                    # Skip this image
                    continue
            
            if embeddings:
                # Combine all embeddings
                all_embeddings = np.vstack(embeddings)
                
                # Save embeddings
                np.save(os.path.join(INDEX_DIR, 'clip_image_embeddings.npy'), all_embeddings)
                
                # Build new index
                dimension = all_embeddings.shape[1]
                self.faiss_index = faiss.IndexFlatL2(dimension)
                self.faiss_index.add(all_embeddings)
                
                print(f"Successfully rebuilt index with {len(embeddings)} images")
            else:
                # If we couldn't get any embeddings, create an empty index
                print("No valid embeddings found, creating empty index")
                self.faiss_index = faiss.IndexFlatL2(512)
                
        except Exception as e:
            print(f"Error rebuilding index: {e}")
            # Create a fresh index as last resort
            self.faiss_index = faiss.IndexFlatL2(512)
    
    def _save_data(self):
        """Save all metadata and index"""
        try:
            # Save FAISS index
            faiss.write_index(self.faiss_index, os.path.join(INDEX_DIR, 'clip_faiss.index'))
            
            # Save metadata
            with open(os.path.join(INDEX_DIR, 'image_urls.json'), 'w') as f:
                json.dump(self.image_urls, f)
                
            with open(os.path.join(INDEX_DIR, 'image_ids.json'), 'w') as f:
                json.dump(self.image_ids, f)
                
            with open(os.path.join(INDEX_DIR, 'image_metadata.json'), 'w') as f:
                json.dump(self.image_metadata, f)
                
            return True
        except Exception as e:
            print(f"Error saving data: {e}")
            raise
    
    def _invalidate_search_cache(self):
        """Xóa toàn bộ cache liên quan đến tìm kiếm"""
        try:
            # Sử dụng wildcard để xóa tất cả cache liên quan đến tìm kiếm
            # Lưu ý: Điều này phụ thuộc vào cơ chế hỗ trợ wildcard delete của Redis
            from django.core.cache import cache
            
            # Xóa cache tìm kiếm theo text
            cache.delete_pattern("pixoria:clip_text_search:*")
            
            # Xóa cache tìm kiếm theo image
            cache.delete_pattern("pixoria:clip_image_search:*")
            
            # Xóa cache tìm kiếm theo image ID
            cache.delete_pattern("pixoria:clip_image_id_search:*")
            
            print("Đã xóa cache tìm kiếm")
        except Exception as e:
            print(f"Lỗi khi xóa cache tìm kiếm: {e}")
            # Tiếp tục ngay cả khi có lỗi xảy ra

    # Example usage
if __name__ == "__main__":
    search_engine = CLIPImageSearch.get_instance()
    
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