import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import requests
from io import BytesIO

class FeatureExtractor:
    def __init__(self, use_gpu=True):
        """
        Khởi tạo Feature Extractor sử dụng mô hình ResNet50 pre-trained.
        
        Args:
            use_gpu (bool): Sử dụng GPU nếu có.
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() and use_gpu else "cpu")
        print(f"Using device: {self.device}")

        # Load mô hình ResNet50 và loại bỏ fully connected layer cuối cùng
        self.model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        self.model = torch.nn.Sequential(*list(self.model.children())[:-1]).to(self.device)
        self.model.eval()

        # Tiền xử lý ảnh đầu vào
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

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

    def extract_features(self, image_source):
        """
        Trích xuất vector đặc trưng 2048 chiều từ ảnh.
        
        Args:
            image_source (str): URL hoặc đường dẫn ảnh.
            
        Returns:
            np.ndarray | None: Vector đặc trưng hoặc None nếu lỗi.
        """
        image = self.load_image(image_source)
        if image is None:
            return None
        
        image = self.transform(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            features = self.model(image).squeeze().cpu().numpy()
        return features

    def extract_features_batch(self, image_sources, batch_size=32):
        """
        Trích xuất đặc trưng theo batch.
        
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
                    batch_images.append(self.transform(img))
                    batch_valid_indices.append(i + j)
            
            # Kiểm tra nếu không có ảnh hợp lệ trong batch
            if not batch_images:
                continue
                
            # Xử lý batch ảnh hợp lệ
            batch_tensor = torch.stack(batch_images).to(self.device)
            with torch.no_grad():
                batch_features = self.model(batch_tensor).squeeze().cpu().numpy()
                
            # Xử lý trường hợp chỉ có một ảnh trong batch
            if len(batch_images) == 1:
                batch_features = batch_features.reshape(1, -1)
                
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