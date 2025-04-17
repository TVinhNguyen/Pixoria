import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from clip_retrieval.run_test import run_test

# Ví dụ sử dụng cơ bản
results = run_test(
    index_path="D:/VS\Django\pexels/Pixoria/webImage/mediafiles/clip_index/photo_index_clip.faiss",
    mapping_path="D:/VS/Django/pexels/Pixoria/webImage/mediafiles/clip_index/photo_mapping_clip.pkl",
    queries=["bầu trời"],
    top_k=5,
    use_gpu=True
)

# Xử lý kết quả tìm kiếm nếu cần
if results:
    for query, search_results in results.items():
        print(f"Truy vấn '{query}' có {len(search_results)} kết quả")