import os
import json
import faiss
import numpy as np
import pickle
from tqdm import tqdm
import requests
from .feature_extractor import FeatureExtractor

class IndexBuilder:
    def __init__(self, feature_dim=2048, use_gpu=True):
        """
        Xây dựng FAISS index.
        
        Args:
            feature_dim (int): Số chiều của vector đặc trưng.
            use_gpu (bool): Sử dụng GPU nếu có.
        """
        self.feature_dim = feature_dim
        self.use_gpu = use_gpu
        self.extractor = FeatureExtractor(use_gpu=use_gpu)
        self.image_data = []  # Lưu thông tin ảnh

        # Khởi tạo FAISS index với L2 distance
        self.index = faiss.IndexFlatL2(feature_dim)

        # Nếu có GPU, chuyển index sang GPU
        if use_gpu and faiss.get_num_gpus() > 0:
            print(f"🚀 Using FAISS GPU (gpus available: {faiss.get_num_gpus()})")
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)
        else:
            print("🖥️ Using FAISS CPU")

    def load_s3_data(self, json_file=None, api_url=None, total_pages=None):
        """
        Tải dữ liệu ảnh từ file JSON hoặc từ API.
        
        Args:
            json_file (str): Đường dẫn đến file JSON chứa thông tin ảnh
            api_url (str): URL API cơ sở để lấy thông tin ảnh
            total_pages (int): Tổng số trang dữ liệu (nếu biết)
            
        Returns:
            list: Danh sách thông tin ảnh
        """
        if json_file:
            with open(json_file, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict) and "results" in data:
                    self.image_data = data["results"]
                else:
                    self.image_data = data
        elif api_url:
            base_url = api_url.split('?')[0] if '?' in api_url else api_url
            base_url = base_url.rstrip('/')
            
            if total_pages is None:
                # Lấy trang đầu tiên để kiểm tra số trang
                response = requests.get(f"{base_url}/?page=1")
                response.raise_for_status()
                
                try:
                    data = response.json()
                    
                    # Kiểm tra cấu trúc dữ liệu trả về
                    print(f"Kiểm tra cấu trúc dữ liệu API trả về: {type(data)}")
                    if isinstance(data, list):
                        # API trả về trực tiếp danh sách các mục
                        page_data = data
                        print(f"API trả về danh sách với {len(page_data)} mục")
                        if page_data and isinstance(page_data[0], str):
                            print("Định dạng: Danh sách các URL chuỗi")
                        else:
                            print(f"Mẫu dữ liệu đầu tiên: {page_data[0] if page_data else None}")
                    elif isinstance(data, dict) and "results" in data:
                        page_data = data["results"]
                        total_count = data.get("count", 0)
                        print(f"Tổng số ảnh: {total_count}")
                    else:
                        page_data = [data]  # Đặt trong một danh sách nếu không khớp định dạng dự kiến
                    
                    self.image_data.extend(page_data)
                    print(f"📄 Loaded page 1 with {len(page_data)} items")
                    
                    # Nếu API trả về theo định dạng phân trang
                    next_url = data.get("next") if isinstance(data, dict) else None
                    page = 2
                    
                    while next_url:
                        try:
                            response = requests.get(next_url)
                            response.raise_for_status()
                            
                            data = response.json()
                            if isinstance(data, dict) and "results" in data:
                                page_data = data["results"]
                                next_url = data.get("next")
                            else:
                                page_data = data if isinstance(data, list) else [data]
                                next_url = None
                            
                            if not page_data:  # Nếu không có dữ liệu, ngừng
                                break
                                
                            self.image_data.extend(page_data)
                            print(f"📄 Loaded page {page} with {len(page_data)} items")
                            page += 1
                        except Exception as e:
                            print(f"❌ Error loading page {page}: {e}")
                            break
                
                except Exception as e:
                    print(f"❌ Error parsing API response: {e}")
                    # Thử xử lý dưới dạng văn bản
                    try:
                        text_data = response.text
                        lines = [line.strip() for line in text_data.split('\n') if line.strip()]
                        print(f"API trả về {len(lines)} dòng văn bản")
                        self.image_data = lines
                    except Exception as text_e:
                        print(f"❌ Không thể xử lý phản hồi dưới dạng văn bản: {text_e}")
            
            else:
                # Nếu biết trước số trang, sử dụng tqdm để theo dõi tiến trình
                for page in tqdm(range(1, total_pages + 1), desc="Tải dữ liệu"):
                    try:
                        response = requests.get(f"{base_url}/?page={page}")
                        response.raise_for_status()
                        
                        try:
                            data = response.json()
                            if isinstance(data, list):
                                page_data = data
                            elif isinstance(data, dict) and "results" in data:
                                page_data = data["results"]
                            else:
                                page_data = [data]
                                    
                            self.image_data.extend(page_data)
                            
                        except Exception as e:
                            print(f"❌ Error parsing API response on page {page}: {e}")
                            # Thử xử lý dưới dạng văn bản
                            try:
                                text_data = response.text
                                lines = [line.strip() for line in text_data.split('\n') if line.strip()]
                                self.image_data.extend(lines)
                            except Exception as text_e:
                                print(f"❌ Không thể xử lý phản hồi dưới dạng văn bản: {text_e}")
                                
                    except Exception as e:
                        print(f"❌ Error loading page {page}: {e}")
        
        else:
            raise ValueError("Cần cung cấp json_file hoặc api_url")
            
        print(f"📸 Loaded {len(self.image_data)} items tổng cộng")
        
        # Kiểm tra và in một số mẫu dữ liệu
        if self.image_data:
            print("Mẫu dữ liệu:")
            for i in range(min(3, len(self.image_data))):
                print(f"  - {self.image_data[i]}")
        
        return self.image_data

    def build_index_from_s3(self, json_file=None, api_url=None, total_pages=None, batch_size=32):
        """
        Xây dựng index FAISS từ dữ liệu ảnh S3.
        
        Args:
            json_file (str): Đường dẫn đến file JSON chứa thông tin ảnh
            api_url (str): URL API để lấy thông tin ảnh
            total_pages (int): Tổng số trang (nếu biết trước)
            batch_size (int): Kích thước batch khi xử lý ảnh
        """
        # Tải dữ liệu ảnh
        self.load_s3_data(json_file, api_url, total_pages)
        print("🔍 Extracting features...")

        # Trích xuất đặc trưng
        features, valid_images = self.extractor.extract_features_from_s3_data(self.image_data, batch_size)
        
        # Cập nhật danh sách ảnh với chỉ các ảnh hợp lệ
        self.image_data = valid_images
        
        if len(features) > 0:
            print("⚡ Adding features to FAISS index...")
            self.index.add(features)
            print(f"✅ Index built with {self.index.ntotal} images")
        else:
            print("❌ No valid images found. Index not built.")

    def save(self, index_path, mapping_path):
        """
        Lưu FAISS index và mapping vào file.
        
        Args:
            index_path (str): Đường dẫn lưu FAISS index.
            mapping_path (str): Đường dẫn lưu mapping.
        """
        if self.use_gpu and faiss.get_num_gpus() > 0:
            faiss.write_index(faiss.index_gpu_to_cpu(self.index), str(index_path))
        else:
            faiss.write_index(self.index, index_path)

        with open(mapping_path, 'wb') as f:
            pickle.dump(self.image_data, f)

        print(f"💾 Index saved to {index_path}")
        print(f"📝 Image mapping saved to {mapping_path}")

    def load(self, index_path, mapping_path):
        """
        Tải FAISS index và mapping từ file.
        
        Args:
            index_path (str): Đường dẫn file FAISS index.
            mapping_path (str): Đường dẫn file mapping.
        """
        self.index = faiss.read_index(str(index_path))

        if self.use_gpu and faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)

        with open(mapping_path, 'rb') as f:
            self.image_data = pickle.load(f)

        print(f"✅ Loaded index with {self.index.ntotal} vectors")
        print(f"📂 Loaded {len(self.image_data)} image records")

    def search(self, query_image, top_k=5):
        """
        Tìm kiếm ảnh tương tự.
        
        Args:
            query_image (str): URL hoặc đường dẫn ảnh truy vấn.
            top_k (int): Số lượng kết quả trả về.
            
        Returns:
            list: Danh sách dict chứa thông tin ảnh tương tự và khoảng cách.
        """
        # Trích xuất đặc trưng từ ảnh truy vấn
        query_feature = self.extractor.extract_features(query_image)
        if query_feature is None:
            return []
            
        # Reshape query_feature nếu cần
        query_feature = query_feature.reshape(1, -1)
            
        # Tìm kiếm ảnh tương tự
        distances, indices = self.index.search(query_feature, top_k)
        
        # Tạo kết quả
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.image_data) and idx >= 0:  # Kiểm tra index hợp lệ
                # Xử lý cả trường hợp self.image_data[idx] là string hoặc dict
                if isinstance(self.image_data[idx], dict):
                    result = self.image_data[idx].copy()  # Copy để không thay đổi dữ liệu gốc
                    result["distance"] = float(distances[0][i])
                else:
                    # Nếu không phải dict (có thể là string), tạo dict mới
                    image_data = self.image_data[idx]
                    result = {
                        "id": idx,  # Sử dụng index làm id nếu không có
                        "file": image_data if isinstance(image_data, str) else str(image_data),
                        "distance": float(distances[0][i])
                    }
                results.append(result)
                
        return results