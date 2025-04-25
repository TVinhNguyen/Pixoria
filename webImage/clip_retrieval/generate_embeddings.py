import torch
import clip
import json
import requests
import numpy as np
import faiss
from PIL import Image
from io import BytesIO
import os
from tqdm import tqdm
from django.conf import settings

INDEX_DIR = settings.INDEX_CLIP_DIR
# Define the index directory
# INDEX_DIR = r".\mediafiles\clip_index"

def generate_clip_embeddings():
    """Generate CLIP embeddings for all images, save them, and build FAISS index"""
    # Ensure index directory exists
    os.makedirs(INDEX_DIR, exist_ok=True)
    
    # Load CLIP model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)
    
    # Load image metadata
    metadata_path = os.path.join(INDEX_DIR, 'image_metadata.json')
    with open(metadata_path, 'r') as f:
        images = json.load(f)
    
    # Generate embeddings
    embeddings = []
    image_urls = []
    image_ids = []
    failed_images = []
    
    print(f"Generating embeddings for {len(images)} images on {device}...")
    
    for image in tqdm(images):
        try:
            # Get image URL and ID
            image_url = image['file']
            image_id = image['id']
            
            # Download image
            response = requests.get(image_url, stream=True)
            if response.status_code != 200:
                print(f"Failed to download image {image_id}: {response.status_code}")
                failed_images.append(image_id)
                continue
                
            # Open image
            img = Image.open(BytesIO(response.content)).convert('RGB')
            
            # Preprocess and generate embedding
            image_input = preprocess(img).unsqueeze(0).to(device)
            with torch.no_grad():
                image_feature = model.encode_image(image_input)
                # Normalize embedding
                image_feature /= image_feature.norm(dim=-1, keepdim=True)
                
            # Add to lists
            embeddings.append(image_feature.cpu().numpy().flatten())
            image_urls.append(image_url)
            image_ids.append(image_id)
            
        except Exception as e:
            print(f"Error processing image {image.get('id', 'unknown')}: {e}")
            failed_images.append(image.get('id', 'unknown'))
    
    # Convert list to array
    embeddings_array = np.array(embeddings).astype('float32')
    
    # Save embeddings to numpy file for backup
    np.save(os.path.join(INDEX_DIR, 'clip_image_embeddings.npy'), embeddings_array)
    
    # Save image URLs and IDs
    with open(os.path.join(INDEX_DIR, 'image_urls.json'), 'w') as f:
        json.dump(image_urls, f)
        
    with open(os.path.join(INDEX_DIR, 'image_ids.json'), 'w') as f:
        json.dump(image_ids, f)
    
    with open(os.path.join(INDEX_DIR, 'failed_images.json'), 'w') as f:
        json.dump(failed_images, f)
    
    # Build FAISS index
    dimension = embeddings_array.shape[1]  # Should be 512 for CLIP ViT-B/32
    
    # Create FAISS index - using L2 distance
    # For normalized vectors, L2 distance is equivalent to cosine similarity
    index = faiss.IndexFlatL2(dimension)
    
    # Add embeddings to the index
    index.add(embeddings_array)
    
    # Save FAISS index
    faiss.write_index(index, os.path.join(INDEX_DIR, 'clip_faiss.index'))
    
    print(f"Successfully generated embeddings for {len(embeddings)} images")
    print(f"Failed to process {len(failed_images)} images")
    print(f"FAISS index created and saved to {os.path.join(INDEX_DIR, 'clip_faiss.index')}")
    
    return embeddings_array, image_urls, image_ids

if __name__ == "__main__":
    generate_clip_embeddings()