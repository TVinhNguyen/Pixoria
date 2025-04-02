from django.core.management.base import BaseCommand
from media.models import Image, INDEX_CLIP_PATH, MAPPING_PATH
from clip_retrieval.clip_retriever import CLIPRetriever

class Command(BaseCommand):
    help = 'Cập nhật hoặc xây dựng lại CLIP index cho tìm kiếm ảnh dựa trên truy vấn văn bản'

    def add_arguments(self, parser):
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
        retriever = CLIPRetriever()

        # Xử lý tùy chọn rebuild (xây dựng lại)
        if options['rebuild']:
            self.stdout.write("🔨 Đang xây dựng lại CLIP index từ đầu...")
            retriever.build_index()
        else:
            # Tải index hiện có nếu có
            if retriever.load_index(INDEX_CLIP_PATH):
                self.stdout.write(f"📋 Đã tải CLIP index hiện có")
            else:
                self.stdout.write("🔨 Chưa có index, đang tạo mới...")
                retriever.build_index()

        # Lấy danh sách ảnh cần xử lý
        query = Image.objects.filter(is_public=True)
        if query.count() == 0:
            self.stdout.write(self.style.WARNING("⚠️ Không có ảnh nào để xử lý"))
            return

        # Xử lý batch theo batch để tiết kiệm bộ nhớ
        batch_size = options['batch_size']
        total_images = query.count()
        processed = 0

        # Xử lý từng batch
        for i in range(0, total_images, batch_size):
            batch = list(query[i:i + batch_size])
            retriever.update_index(batch)
            processed += len(batch)

            self.stdout.write(f"✓ Đã xử lý {min(i + batch_size, total_images)}/{total_images} ảnh")

        # Lưu index
        retriever.save_index(INDEX_PATH)

        self.stdout.write(self.style.SUCCESS(
            f"✅ Hoàn thành! Đã xử lý {processed} ảnh."
        ))