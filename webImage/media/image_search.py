import os
import sys

# Lấy đường dẫn gốc của Django project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)  # Đảm bảo import được các module trong dự án

from imageretrieval.index_builder import IndexBuilder  # Import đúng

# Tránh lỗi OpenMP
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

class ImageSearch:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """Singleton pattern để đảm bảo chỉ tạo một instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def __init__(self):
        """Khởi tạo ImageSearch với FAISS index"""
        self.builder = IndexBuilder(use_gpu=True)
        try:
            # Định nghĩa đường dẫn chính xác tới FAISS index và mapping
            base_path = os.path.join(BASE_DIR, "imageretrieval")
            index_path = os.path.join(base_path, "photo_index.faiss")
            mapping_path = os.path.join(base_path, "photo_mapping.pkl")
            
            print(f"🔄 Đang tải index từ: {index_path}")
            print(f"🔄 Đang tải mapping từ: {mapping_path}")
            
            self.builder.load(index_path, mapping_path)
            print(f"✅ Đã tải FAISS index với {self.builder.index.ntotal} ảnh")
        except Exception as e:
            print(f"❌ Không thể tải FAISS index: {e}")
            print("👉 Hãy chắc chắn bạn đã xây dựng index trước khi chạy server")
            self.builder = None
            
    def search(self, image_path, top_k=10):
        """
        Tìm kiếm ảnh tương tự
        
        Args:
            image_path (str): Đường dẫn hoặc URL đến ảnh
            top_k (int): Số lượng kết quả trả về
            
        Returns:
            list: Danh sách các ảnh tương tự
        """
        if self.builder is None:
            raise Exception("FAISS index chưa được tải")
            
        return self.builder.search(image_path, top_k=top_k)
