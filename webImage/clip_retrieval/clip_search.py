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
    # Singleton instance
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """Singleton pattern to ensure only one instance is created"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        # This prevents re-initialization if this is a singleton instance
        if hasattr(CLIPImageSearch, '_initialized') and CLIPImageSearch._initialized:
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

    def update_index_for_image(self, image_id):
        """Add a new image to the FAISS index"""
        try:
            # Get the image from Django ORM
            from media.models import Image
            image = Image.objects.get(id=image_id)
            
            # Process the image
            image_url = image.file.url
            img_response = requests.get(image_url, stream=True)
            img = Image.open(BytesIO(img_response.content)).convert('RGB')
            
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
                if img_id == image_id:
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
            self.image_metadata = [img for img in self.image_metadata if img['id'] != image_id]
            
            # Rebuild FAISS index (since FAISS doesn't support direct removal)
            # Load embeddings if available
            embedding_path = os.path.join(INDEX_DIR, 'clip_image_embeddings.npy')
            if os.path.exists(embedding_path):
                all_embeddings = np.load(embedding_path)
                # Remove the embedding for this image
                all_embeddings = np.delete(all_embeddings, image_index, axis=0)
                # Save updated embeddings
                np.save(embedding_path, all_embeddings)
                
                # Recreate the index
                dimension = all_embeddings.shape[1]
                self.faiss_index = faiss.IndexFlatL2(dimension)
                self.faiss_index.add(all_embeddings)
            else:
                print("Warning: Need to rebuild index completely as embeddings file not found")
                # This would require regenerating all embeddings
            
            # Save updated data
            self._save_data()
            
            return True
            
        except Exception as e:
            print(f"Error removing image {image_id} from index: {e}")
            raise
    
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