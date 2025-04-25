import os
import time
import clip
import torch
import numpy as np
import faiss
import pickle
from PIL import Image

class CLIPRetriever:
    """
    Class sử dụng CLIP và FAISS để tìm kiếm ảnh dựa trên văn bản.
    """
    
    def __init__(self, index_path, mapping_path, use_gpu=True):
        """
        Khởi tạo CLIP Retriever.
        
        Args:
            index_path (str): Đường dẫn đến FAISS index.
            mapping_path (str): Đường dẫn đến file mapping.
            use_gpu (bool): Sử dụng GPU nếu có.
        """
        # Tải CLIP model
        self.device = "cuda" if use_gpu and torch.cuda.is_available() else "cpu"
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        
        # Tải FAISS index
        self.index = faiss.read_index(index_path)
        
        # Chuyển index lên GPU nếu có thể
        if self.device == "cuda":
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)
        
        # Tải mapping
        with open(mapping_path, 'rb') as f:
            self.mapping = pickle.load(f)
    
    def retrieve_images(self, text_query, top_k=5):
        """
        Tìm kiếm ảnh dựa trên văn bản.
        
        Args:
            text_query (str): Văn bản truy vấn.
            top_k (int): Số lượng kết quả trả về.
            
        Returns:
            list: Danh sách kết quả tìm kiếm.
        """
        # Mã hóa truy vấn văn bản
        with torch.no_grad():
            text_features = self.model.encode_text(clip.tokenize([text_query]).to(self.device))
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        # Chuyển về numpy array
        text_features_np = text_features.cpu().numpy().astype('float32')
        
        # Tìm kiếm bằng FAISS
        D, I = self.index.search(text_features_np, top_k)
        
        # Lấy kết quả từ mapping
        results = []
        for i, (distance, idx) in enumerate(zip(D[0], I[0])):
            if idx >= 0 and idx < len(self.mapping):  # Kiểm tra index hợp lệ
                # Tính điểm tương đồng từ khoảng cách Euclidean
                # CLIP embedding đã được chuẩn hóa nên distance có thể chuyển thành
                # cosine similarity bằng công thức: 2 - 2 * distance
                similarity = 1.0 - distance / 2.0
                
                # Lấy thông tin ảnh từ mapping
                image_info = self.mapping[idx].copy()
                
                # Thêm điểm tương đồng vào kết quả
                image_info["similarity_score"] = float(similarity)
                
                results.append(image_info)
        
        return results
    
    def retrieve_by_image(self, image_path, top_k=5):
        """
        Tìm kiếm ảnh dựa trên một ảnh khác.
        
        Args:
            image_path (str): Đường dẫn đến ảnh truy vấn.
            top_k (int): Số lượng kết quả trả về.
            
        Returns:
            list: Danh sách kết quả tìm kiếm.
        """
        # Tải và tiền xử lý ảnh
        try:
            image = self.preprocess(Image.open(image_path)).unsqueeze(0).to(self.device)
        except Exception as e:
            print(f"Lỗi khi tải ảnh: {e}")
            return []
        
        # Mã hóa ảnh
        with torch.no_grad():
            image_features = self.model.encode_image(image)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        
        # Chuyển về numpy array
        image_features_np = image_features.cpu().numpy().astype('float32')
        
        # Tìm kiếm bằng FAISS
        D, I = self.index.search(image_features_np, top_k)
        
        # Lấy kết quả từ mapping
        results = []
        for i, (distance, idx) in enumerate(zip(D[0], I[0])):
            if idx >= 0 and idx < len(self.mapping):  # Kiểm tra index hợp lệ
                # Tính điểm tương đồng từ khoảng cách Euclidean
                similarity = 1.0 - distance / 2.0
                
                # Lấy thông tin ảnh từ mapping
                image_info = self.mapping[idx].copy()
                
                # Thêm điểm tương đồng vào kết quả
                image_info["similarity_score"] = float(similarity)
                
                results.append(image_info)
        
        return results