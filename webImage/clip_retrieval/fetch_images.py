import requests
import json
import os
import time
from django.conf import settings

INDEX_DIR = settings.INDEX_CLIP_DIR
# Define the index directory
# INDEX_DIR = r".\mediafiles\clip_index"

def fetch_all_images(base_url="http://127.0.0.1:8000/images/"):
    """Fetch all images from the API and save their metadata"""
    # Ensure index directory exists
    os.makedirs(INDEX_DIR, exist_ok=True)
    
    all_images = []
    next_url = base_url
    page = 1
    
    print("Starting to fetch images...")
    
    while next_url:
        print(f"Fetching page {page}...")
        response = requests.get(next_url)
        
        if response.status_code != 200:
            print(f"Error fetching page {page}: {response.status_code}")
            break
            
        data = response.json()
        all_images.extend(data['results'])
        next_url = data['next']
        page += 1
        
        # Optional: Add a small delay to avoid overwhelming the API
        time.sleep(0.5)
    
    print(f"Fetched a total of {len(all_images)} images")
    
    # Save the metadata to the clip_index folder
    metadata_path = os.path.join(INDEX_DIR, 'image_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(all_images, f)
    
    print(f"Metadata saved to {metadata_path}")
        
    return all_images

if __name__ == "__main__":
    fetch_all_images()