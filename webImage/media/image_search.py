from django.conf import settings  
from imageretrieval.index_builder import IndexBuilder 

# Tránh lỗi OpenMP
import os
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
            index_path = settings.INDEX_DIR / "photo_index.faiss"
            mapping_path = settings.INDEX_DIR / "photo_mapping.pkl"
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
