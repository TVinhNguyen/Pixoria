import os
import django

# Định nghĩa biến môi trường cho Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webImage.settings')

# Khởi tạo Django
django.setup()
from clip_retrieval.index_builder import IndexBuilder
from clip_retrieval.clip_retriever import CLIPRetriever
from media.models import INDEX_CLIP_PATH, MAPPING_CLIP_PATH

# Initialize and build index from API
builder = IndexBuilder(use_gpu=True)

# Build index from S3
builder.build_index_from_s3(
    api_url="http://127.0.0.1:8000/images",
    total_pages=91,
    batch_size=32
)

# Save index
builder.save(INDEX_CLIP_PATH, MAPPING_CLIP_PATH)

# Initialize CLIP retriever
clip_retriever = CLIPRetriever()

# Example text query for image retrieval
text_query = "A beautiful sunset over the mountains"
results = clip_retriever.retrieve_images(text_query, top_k=10)

# Print results
print(f"\nResults for text query: '{text_query}'")
print("-" * 80)
for i, result in enumerate(results):
    print(f"{i + 1}. ID: {result['id']}")
    print(f"   Title: {result['title']}")
    print(f"   URL: {result['file']}")
    print(f"   Similarity Score: {result['similarity_score']:.4f}")
    print()