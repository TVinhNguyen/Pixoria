import torch
import clip
import numpy as np
import pickle
import faiss
from PIL import Image
import requests
from io import BytesIO

class CLIPRetriever:
    def __init__(self, index_path=None, mapping_path=None, use_gpu=True):
        """
        Khởi tạo CLIP Retriever cho tìm kiếm ảnh bằng văn bản.
        
        Args:
            index_path (str): Đường dẫn đến FAISS index.
            mapping_path (str): Đường dẫn đến file mapping.
            use_gpu (bool): Sử dụng GPU nếu có.
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() and use_gpu else "cpu")
        
        # Tải model CLIP ViT-B/32
        print(f"🔄 Loading CLIP ViT-B/32 model for text retrieval...")
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        self.model.eval()
        print(f"✅ CLIP ViT-B/32 model loaded successfully")
        
        # Tải index và mapping nếu được cung cấp
        self.index = None
        self.image_data = []
        
        if index_path and mapping_path:
            self.load(index_path, mapping_path, use_gpu)
        
    def load(self, index_path, mapping_path, use_gpu=True):
        """
        Tải FAISS index và mapping từ file.
        
        Args:
            index_path (str): Đường dẫn file FAISS index.
            mapping_path (str): Đường dẫn file mapping.
            use_gpu (bool): Sử dụng GPU nếu có.
        """
        self.index = faiss.read_index(str(index_path))

        if use_gpu and faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)

        with open(mapping_path, 'rb') as f:
            self.image_data = pickle.load(f)

        print(f"✅ Loaded index with {self.index.ntotal} vectors")
        print(f"📂 Loaded {len(self.image_data)} image records")
    
    def encode_text(self, text):
        """
        Mã hóa văn bản thành vector đặc trưng sử dụng CLIP.
        
        Args:
            text (str): Văn bản cần mã hóa.
            
        Returns:
            np.ndarray: Vector đặc trưng của văn bản.
        """
        with torch.no_grad():
            text_inputs = clip.tokenize([text]).to(self.device)
            text_features = self.model.encode_text(text_inputs)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        return text_features.cpu().numpy()
    
    def retrieve_images(self, text_query, top_k=10):
        """
        Tìm kiếm ảnh theo văn bản.
        
        Args:
            text_query (str): Văn bản truy vấn.
            top_k (int): Số lượng kết quả trả về.
            
        Returns:
            list: Danh sách dict chứa thông tin ảnh tương tự và điểm tương đồng.
        """
        if self.index is None:
            print("⚠️ Index chưa được tải. Vui lòng tải index trước khi tìm kiếm.")
            return []
        
        # Mã hóa văn bản thành vector
        text_features = self.encode_text(text_query)
        
        # Tìm kiếm ảnh tương tự
        similarities, indices = self.index.search(text_features, top_k)
        
        # Tạo kết quả
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.image_data) and idx >= 0:
                if isinstance(self.image_data[idx], dict):
                    result = self.image_data[idx].copy()
                    result["similarity_score"] = float(similarities[0][i])
                else:
                    image_data = self.image_data[idx]
                    result = {
                        "id": idx,
                        "file": image_data if isinstance(image_data, str) else str(image_data),
                        "similarity_score": float(similarities[0][i])
                    }
                results.append(result)
                
        return results