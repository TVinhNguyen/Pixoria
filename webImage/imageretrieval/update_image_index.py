from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import os
from media.models import Image , INDEX_PATH, MAPPING_PATH
from .incremental_update  import IndexUpdater

class Command(BaseCommand):
    help = 'Cập nhật hoặc xây dựng lại FAISS index cho tìm kiếm ảnh tương tự'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recent',
            type=int,
            help='Chỉ xử lý ảnh được tạo trong N ngày gần đây'
        )
        parser.add_argument(
            '--rebuild',
            action='store_true',
            help='Xây dựng lại index từ đầu thay vì cập nhật'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=32,
            help='Kích thước batch khi xử lý ảnh (mặc định: 32)'
        )

    def handle(self, *args, **options):
        updater = IndexUpdater()
        
        # Xử lý tùy chọn rebuild (xây dựng lại)
        if options['rebuild']:
            self.stdout.write("🔨 Đang xây dựng lại index từ đầu...")
        else:
            # Tải index hiện có nếu có
            if os.path.exists(INDEX_PATH) and os.path.exists(MAPPING_PATH):
                try:
                    updater.load(INDEX_PATH, MAPPING_PATH)
                    self.stdout.write(f"📋 Đã tải index hiện có với {updater.index.ntotal} ảnh")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"⚠️ Không thể tải index hiện có: {e}"))
                    self.stdout.write("🔨 Đang tạo index mới...")
            else:
                self.stdout.write("🔨 Chưa có index, đang tạo mới...")
        
        # Lấy danh sách ảnh cần xử lý
        query = Image.objects.filter(is_public=True)
        if options['recent']:
            cutoff_date = timezone.now() - timedelta(days=options['recent'])
            query = query.filter(created_at__gte=cutoff_date)
            self.stdout.write(f"🔍 Đang xử lý {query.count()} ảnh từ {options['recent']} ngày qua")
        else:
            self.stdout.write(f"🔍 Đang xử lý tất cả {query.count()} ảnh công khai")
        
        if query.count() == 0:
            self.stdout.write(self.style.WARNING("⚠️ Không có ảnh nào để xử lý"))
            return
        
        # Xử lý batch theo batch để tiết kiệm bộ nhớ
        batch_size = options['batch_size']
        total_images = query.count()
        processed = 0
        
        # Xử lý từng batch
        for i in range(0, total_images, batch_size):
            batch = list(query[i:i+batch_size])
            if options['rebuild'] and i == 0:
                # Khởi tạo index với batch đầu tiên
                features, valid_images = updater.extractor.extract_features_from_s3_data(batch, batch_size)
                if features.shape[0] > 0:
                    updater.index = updater.index.__class__(updater.feature_dim)
                    updater.index.add(features)
                    updater.image_data = valid_images
                    processed += len(valid_images)
            else:
                # Cập nhật index với các batch tiếp theo
                added = updater.update_index(batch, batch_size)
                processed += added
            
            self.stdout.write(f"✓ Đã xử lý {min(i+batch_size, total_images)}/{total_images} ảnh")
        
        # Lưu index và mapping
        os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
        updater.save(INDEX_PATH, MAPPING_PATH)
        
        self.stdout.write(self.style.SUCCESS(
            f"✅ Hoàn thành! Đã xử lý {processed} ảnh. "
            f"Index hiện có {updater.index.ntotal} ảnh."
        ))