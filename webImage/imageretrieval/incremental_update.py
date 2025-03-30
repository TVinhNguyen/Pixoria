import os
import faiss
import numpy as np
import pickle
from tqdm import tqdm
import requests
from imageretrieval.index_builder import IndexBuilder

class IndexUpdater(IndexBuilder):
    def update_index(self, new_images, batch_size=32):
        """
        Cập nhật FAISS index với các ảnh mới mà không cần xây dựng lại hoàn toàn.
        
        Args:
            new_images (list): Danh sách các Image objects hoặc URLs mới
            batch_size (int): Kích thước batch khi xử lý ảnh
            
        Returns:
            int: Số lượng ảnh đã thêm vào index
        """
        print(f"🔄 Updating index with {len(new_images)} new images...")
        
        # Chuyển đổi Django model objects thành dict để phù hợp với API hiện tại
        image_data = []
        for img in new_images:
            if hasattr(img, 'file'):  # Django model object
                image_data.append({
                    'id': img.id,
                    'file': img.file.url,  # Lấy URL từ S3
                    'title': img.title,
                    'user': img.user.user.username,
                    'created_at': img.created_at.isoformat(),
                    'is_public': img.is_public
                })
            elif isinstance(img, dict):
                image_data.append(img)  # Đã là dict
            else:
                image_data.append({'file': str(img)})  # Chuỗi URL đơn giản
        
        # Trích xuất đặc trưng
        features, valid_images = self.extractor.extract_features_from_s3_data(image_data, batch_size)
        
        if len(features) > 0:
            # Thêm features mới vào index
            self.index.add(features)
            
            # Thêm thông tin ảnh mới vào mapping
            self.image_data.extend(valid_images)
            
            print(f"✅ Index updated, now containing {self.index.ntotal} images")
            return len(valid_images)
        else:
            print("❌ No valid images to add.")
            return 0

    def remove_from_index(self, image_ids):
        """
        Xóa các ảnh khỏi index dựa trên ID
        
        Args:
            image_ids (list): Danh sách các ID ảnh cần xóa
            
        Returns:
            int: Số lượng ảnh đã xóa
        """
        if not self.image_data or not image_ids:
            return 0
            
        # Tìm indices của các ảnh cần xóa trong image_data
        indices_to_remove = []
        new_image_data = []
        
        for i, img_data in enumerate(self.image_data):
            img_id = img_data.get('id') if isinstance(img_data, dict) else None
            if img_id in image_ids:
                indices_to_remove.append(i)
            else:
                new_image_data.append(img_data)
                
        if not indices_to_remove:
            print("❌ No matching images found to remove")
            return 0
            
        # Tạo index mới không có các vectors cần xóa
        # (FAISS không hỗ trợ xóa trực tiếp nên phải tạo lại)
        print(f"🔄 Removing {len(indices_to_remove)} images from index...")
        
        # Chuyển index về CPU nếu cần
        if hasattr(self.index, 'getattr') and hasattr(self.index, 'is_gpu'):
            cpu_index = faiss.index_gpu_to_cpu(self.index)
        else:
            cpu_index = self.index
            
        # Tạo một index mới với cấu hình tương tự
        new_index = faiss.IndexFlatL2(self.feature_dim)
        
        # Copy tất cả vectors trừ những cái cần xóa
        all_vectors = faiss.vector_float_to_array(cpu_index.get_xb())
        all_vectors = all_vectors.reshape(cpu_index.ntotal, cpu_index.d)
        
        keep_vectors = np.delete(all_vectors, indices_to_remove, axis=0)
        
        if len(keep_vectors) > 0:
            new_index.add(keep_vectors)
            
        # Thay thế index cũ bằng index mới
        self.index = new_index
        
        # Chuyển lại sang GPU nếu cần
        if self.use_gpu and faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)
            
        # Cập nhật image_data
        self.image_data = new_image_data
        
        print(f"✅ Successfully removed {len(indices_to_remove)} images, index now has {self.index.ntotal} images")
        return len(indices_to_remove)