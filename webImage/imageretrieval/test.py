import os
import argparse
import time
from datetime import datetime
from .index_builder import IndexBuilder

# Tránh lỗi OpenMP
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def test_image_search(image_path, top_k=10):
    """
    Test tìm kiếm ảnh với một ảnh đầu vào.
    
    Args:
        image_path (str): Đường dẫn hoặc URL đến ảnh cần tìm kiếm.
        top_k (int): Số lượng kết quả trả về.
    """
    print(f"{'=' * 50}")
    print(f"TEST TÌM KIẾM ẢNH TƯƠNG TỰ")
    print(f"{'=' * 50}")
    print(f"User: {os.getlogin()}")
    print(f"Thời gian: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} (UTC)")
    print(f"Ảnh truy vấn: {image_path}")
    print(f"Top-K: {top_k}")
    print(f"{'=' * 50}")
    
    # Tải index
    try:
        print("Đang tải FAISS index...")
        builder = IndexBuilder(use_gpu=True)
        builder.load('photo_index.faiss', 'photo_mapping.pkl')
        print(f"✅ Đã tải index với {builder.index.ntotal} ảnh")
    except Exception as e:
        print(f"❌ Lỗi khi tải index: {e}")
        return
    
    # Thực hiện tìm kiếm
    try:
        print("\nĐang thực hiện tìm kiếm...")
        start_time = time.time()
        results = builder.search(image_path, top_k=top_k)
        search_time = time.time() - start_time
        print(f"✅ Tìm kiếm hoàn tất trong {search_time:.3f} giây")
    except Exception as e:
        print(f"❌ Lỗi khi tìm kiếm: {e}")
        return
    
    # Hiển thị kết quả
    if not results:
        print("\n⚠️ Không tìm thấy kết quả nào!")
        return
        
    print(f"\nKẾT QUẢ TÌM KIẾM:")
    print(f"{'=' * 50}")
    for i, result in enumerate(results):
        print(f"{i+1}. ID: {result.get('id', 'N/A')}")
        print(f"   URL: {result.get('file', 'N/A')}")
        print(f"   Title: {result.get('title', 'N/A')}")
        print(f"   Distance: {result.get('distance', 0):.4f}")
        
        # Thêm một số thông tin khác nếu có
        if 'description' in result and result['description']:
            print(f"   Mô tả: {result['description']}")
        if 'created_at' in result:
            print(f"   Thời gian: {result['created_at']}")
        
        print('-' * 40)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test tìm kiếm ảnh tương tự")
    parser.add_argument("image_path", type=str, 
                        help="Đường dẫn hoặc URL đến ảnh cần tìm kiếm")
    parser.add_argument("--top_k", type=int, default=10,
                        help="Số lượng kết quả trả về (mặc định: 10)")
    
    args = parser.parse_args()
    test_image_search(args.image_path, args.top_k)