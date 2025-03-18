from .index_builder import IndexBuilder

# Khởi tạo và xây dựng index từ API phân trang
builder = IndexBuilder(use_gpu=True)

# Biết trước có 91 trang
builder.build_index_from_s3(
    api_url="http://127.0.0.1:8000/images",
    total_pages=91,
    batch_size=32
)

# Lưu index
builder.save('photo_index.faiss', 'photo_mapping.pkl')

# Hoặc nếu muốn tải lại index đã lưu
# builder.load('photo_index.faiss', 'photo_mapping.pkl')

# Tìm kiếm ảnh tương tự
query_image = "https://photostv.s3.amazonaws.com/image/e29b2113b116a0d12a24b9394193a2b9.jpg"
results = builder.search(query_image, top_k=10)

# In kết quả
print(f"\nKết quả tìm kiếm cho ảnh: {query_image}")
print("-" * 80)
for i, result in enumerate(results):
    print(f"{i+1}. ID: {result['id']}")
    print(f"   Title: {result['title']}")
    print(f"   URL: {result['file']}")
    print(f"   Distance: {result['distance']:.4f}")
    print()