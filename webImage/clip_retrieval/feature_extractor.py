import torch
from PIL import Image
import clip
import numpy as np
import requests
from io import BytesIO

class FeatureExtractor:
    def __init__(self, use_gpu=True):
        self.device = torch.device("cuda" if torch.cuda.is_available() and use_gpu else "cpu")
        print(f"Using device: {self.device}")

        # Tải mô hình CLIP ViT-B/32
        self.model, self.preprocess = clip.load("ViT-B/32", device=self.device)
        print("CLIP model loaded")

    def load_image(self, image_source):
        """
        Tải ảnh từ URL hoặc từ đường dẫn local.
        
        Args:
            image_source (str): URL hoặc đường dẫn ảnh.
        
        Returns:
            PIL.Image: Ảnh đã tải (hoặc None nếu lỗi).
        """
        try:
            if image_source.startswith("http"):  # Tải từ URL
                response = requests.get(image_source, timeout=10)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content)).convert("RGB")
            else:  # Tải từ đường dẫn local
                image = Image.open(image_source).convert("RGB")
            return image
        except Exception as e:
            print(f"❌ Error loading image {image_source}: {e}")
            return None

    def extract_image_features(self, image_source):
        """
        Trích xuất vector đặc trưng từ ảnh sử dụng CLIP.
        
        Args:
            image_source (str): URL hoặc đường dẫn ảnh.
            
        Returns:
            np.ndarray | None: Vector đặc trưng hoặc None nếu lỗi.
        """
        image = self.load_image(image_source)
        if image is None:
            return None
        
        # Tiền xử lý ảnh và trích xuất đặc trưng
        image_input = self.preprocess(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            image_features = self.model.encode_image(image_input)
            # Chuẩn hóa vector
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
        return image_features.cpu().numpy()

    def extract_text_features(self, text):
        """
        Trích xuất vector đặc trưng từ văn bản sử dụng CLIP.
        
        Args:
            text (str): Văn bản cần trích xuất.
            
        Returns:
            np.ndarray: Vector đặc trưng của văn bản.
        """
        # Mã hóa văn bản
        text_input = clip.tokenize([text]).to(self.device)
        with torch.no_grad():
            text_features = self.model.encode_text(text_input)
            # Chuẩn hóa vector
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
        return text_features.cpu().numpy()

    def extract_features_batch(self, image_sources, batch_size=32):
        """
        Trích xuất đặc trưng theo batch từ nhiều ảnh.
        
        Args:
            image_sources (list): Danh sách URL hoặc đường dẫn ảnh.
            batch_size (int): Kích thước batch.
            
        Returns:
            tuple: (features, valid_indices) - Ma trận đặc trưng và các chỉ số hợp lệ
        """
        num_images = len(image_sources)
        all_features = []
        valid_indices = []

        for i in range(0, num_images, batch_size):
            batch_sources = image_sources[i:i+batch_size]
            batch_images = []
            batch_valid_indices = []
            
            # Tải và tiền xử lý ảnh trong batch
            for j, src in enumerate(batch_sources):
                img = self.load_image(src)
                if img is not None:
                    batch_images.append(self.preprocess(img))
                    batch_valid_indices.append(i + j)
            
            # Kiểm tra nếu không có ảnh hợp lệ trong batch
            if not batch_images:
                continue
                
            # Xử lý batch ảnh hợp lệ
            batch_tensor = torch.stack(batch_images).to(self.device)
            with torch.no_grad():
                batch_features = self.model.encode_image(batch_tensor)
                batch_features /= batch_features.norm(dim=-1, keepdim=True)
                batch_features = batch_features.cpu().numpy()
                
            all_features.append(batch_features)
            valid_indices.extend(batch_valid_indices)
            print(f"✅ Processed {min(i + batch_size, num_images)}/{num_images} images")

        # Kết hợp các features từ tất cả batch
        if all_features:
            combined_features = np.vstack(all_features)
            return combined_features, valid_indices
        else:
            return np.array([]), []

    def extract_features_from_s3_data(self, image_data, batch_size=32):
        """
        Trích xuất đặc trưng từ dữ liệu S3 định dạng JSON.
        
        Args:
            image_data (list): Danh sách các dict chứa thông tin ảnh từ S3 hoặc danh sách URL
            batch_size (int): Kích thước batch
            
        Returns:
            tuple: (features, valid_images) - Ma trận đặc trưng và thông tin ảnh hợp lệ
        """
        # Kiểm tra xem image_data là danh sách chuỗi URL hay danh sách dict
        if image_data and isinstance(image_data[0], str):
            image_urls = image_data  # Đã là danh sách URL
            is_dict_data = False
        else:
            try:
                image_urls = [item["file"] for item in image_data]
                is_dict_data = True
            except (TypeError, KeyError) as e:
                print(f"❌ Error: Định dạng dữ liệu không hợp lệ: {e}")
                print("Cấu trúc dữ liệu mẫu đầu tiên:", image_data[0] if image_data else None)
                return np.array([]), []
        
        features, valid_indices = self.extract_features_batch(image_urls, batch_size)
        
        # Lọc ra các ảnh hợp lệ
        if is_dict_data:
            valid_images = [image_data[i] for i in valid_indices]
        else:
            valid_images = [image_urls[i] for i in valid_indices]
        
        return features, valid_images