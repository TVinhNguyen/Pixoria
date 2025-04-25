import os
import time
import argparse
import json
from tqdm import tqdm
from clip_retrieval.clip_retriever import CLIPRetriever

def run_test(index_path, mapping_path, queries, top_k=5, use_gpu=True, save_results=True):
    """
    Thực hiện kiểm thử CLIPRetriever.
    
    Args:
        index_path (str): Đường dẫn đến file FAISS index.
        mapping_path (str): Đường dẫn đến file mapping.
        queries (list): Danh sách các văn bản truy vấn.
        top_k (int): Số lượng kết quả trả về cho mỗi truy vấn.
        use_gpu (bool): Sử dụng GPU nếu có.
        save_results (bool): Lưu kết quả vào file.
        
    Returns:
        dict: Kết quả tìm kiếm cho tất cả truy vấn.
    """
    print("\n" + "="*50)
    print("🔍 CLIP Retriever Test")
    print("="*50)
    
    # Kiểm tra file tồn tại
    if not os.path.exists(index_path):
        print(f"❌ Lỗi: File index không tồn tại: {index_path}")
        return None
    
    if not os.path.exists(mapping_path):
        print(f"❌ Lỗi: File mapping không tồn tại: {mapping_path}")
        return None
        
    # Đo thời gian tải model và index
    print(f"📁 Đang tải CLIP model và FAISS index...")
    start_time = time.time()
    
    try:
        retriever = CLIPRetriever(index_path, mapping_path, use_gpu=use_gpu)
    except Exception as e:
        print(f"❌ Lỗi khi tải model và index: {e}")
        return None
        
    load_time = time.time() - start_time
    print(f"✅ Đã tải xong! (Thời gian: {load_time:.2f} giây)")
    
    # Thực hiện tìm kiếm với mỗi truy vấn
    all_results = {}
    total_search_time = 0
    
    print("\n🔎 Đang thực hiện tìm kiếm với các truy vấn:")
    for query in queries:
        print(f"\n📝 Truy vấn: \"{query}\"")
        
        # Đo thời gian tìm kiếm
        search_start = time.time()
        results = retriever.retrieve_images(query, top_k=top_k)
        search_time = time.time() - search_start
        total_search_time += search_time
        
        # Lưu và hiển thị kết quả
        all_results[query] = results
        print(f"⏱️ Thời gian tìm kiếm: {search_time:.4f} giây")
        print(f"📊 Số kết quả tìm thấy: {len(results)}")
        
        # Hiển thị các kết quả
        display_results(results)
    
    # Tính thời gian trung bình
    avg_search_time = total_search_time / len(queries) if queries else 0
    print(f"\n📊 Tổng kết:")
    print(f"   - Số truy vấn thực hiện: {len(queries)}")
    print(f"   - Thời gian tải model và index: {load_time:.2f} giây")
    print(f"   - Thời gian tìm kiếm trung bình: {avg_search_time:.4f} giây/truy vấn")
    
    # Lưu kết quả vào file nếu được yêu cầu
    if save_results and all_results:
        timestamp = int(time.time())
        result_dir = "test_results"
        os.makedirs(result_dir, exist_ok=True)
        
        result_file = os.path.join(result_dir, f"search_results_{timestamp}.json")
        
        try:
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(all_results, f, ensure_ascii=False, indent=4)
            print(f"\n💾 Đã lưu kết quả vào file: {result_file}")
        except Exception as e:
            print(f"❌ Lỗi khi lưu kết quả: {e}")
    
    print("\n" + "="*50)
    return all_results

def display_results(results, max_display=3):
    """
    Hiển thị kết quả tìm kiếm.
    
    Args:
        results (list): Danh sách kết quả tìm kiếm.
        max_display (int): Số lượng kết quả tối đa hiển thị.
    """
    if not results:
        print("   ❌ Không tìm thấy kết quả nào!")
        return
    
    # Chỉ hiển thị một số lượng giới hạn kết quả
    display_count = min(len(results), max_display)
    
    print(f"\n   🖼️ Top {display_count} kết quả:")
    print("   " + "-"*40)
    
    for i, result in enumerate(results[:display_count]):
        similarity = result.get("similarity_score", 0)
        
        print(f"   Kết quả #{i+1} (Điểm tương đồng: {similarity:.4f}):")
        
        # Hiển thị thông tin file/url
        if "file" in result:
            print(f"     🔗 Ảnh: {result['file']}")
        elif "url" in result:
            print(f"     🔗 URL: {result['url']}")
            
        # Hiển thị các metadata khác nếu có
        for key, value in result.items():
            if key not in ["file", "url", "similarity_score"]:
                # Cắt ngắn các trường văn bản dài
                if isinstance(value, str) and len(value) > 70:
                    value = value[:67] + "..."
                print(f"     {key}: {value}")
                
        print("   " + "-"*40)
    
    if len(results) > max_display:
        print(f"   ... và {len(results) - max_display} kết quả khác.")

def main():
    """Hàm main xử lý tham số dòng lệnh và chạy kiểm thử."""
    parser = argparse.ArgumentParser(description="Kiểm thử CLIPRetriever cho tìm kiếm ảnh bằng văn bản.")
    parser.add_argument("--index", type=str, required=True, help="Đường dẫn đến file FAISS index.")
    parser.add_argument("--mapping", type=str, required=True, help="Đường dẫn đến file mapping.")
    parser.add_argument("--queries", type=str, nargs="+", required=True, help="Các văn bản truy vấn.")
    parser.add_argument("--top_k", type=int, default=5, help="Số lượng kết quả hiển thị cho mỗi truy vấn (mặc định: 5).")
    parser.add_argument("--cpu", action="store_true", help="Sử dụng CPU ngay cả khi có GPU.")
    parser.add_argument("--no-save", action="store_true", help="Không lưu kết quả vào file.")
    
    args = parser.parse_args()
    
    run_test(
        args.index,
        args.mapping,
        args.queries,
        top_k=args.top_k,
        use_gpu=not args.cpu,
        save_results=not args.no_save
    )

if __name__ == "__main__":
    main()