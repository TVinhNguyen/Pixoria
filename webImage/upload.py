import os
import django
import mimetypes
from dotenv import load_dotenv
from django.utils.text import slugify

# Tải biến môi trường từ .env
load_dotenv()

# Định nghĩa đường dẫn settings.py
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "webImage.settings")

# Khởi động Django
django.setup()

# Import sau khi Django được khởi động
from media.models import Image, ImageCategory, Category, UserProfile
from django.contrib.auth.models import User
import boto3

# Cấu hình AWS S3
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_S3_REGION_NAME"),
)

S3_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
S3_BASE_PATH = "image/"
LOCAL_DIR = "categories"

# Lấy user admin
admin_user = User.objects.filter(username="admin").first()
if not admin_user:
    raise Exception("root user not found!")

# Kiểm tra nếu UserProfile không tồn tại thì tạo mới
user_profile, created = UserProfile.objects.get_or_create(user=admin_user)

def upload_images():
    for category_name in os.listdir(LOCAL_DIR):
        category_path = os.path.join(LOCAL_DIR, category_name)
        if not os.path.isdir(category_path):
            continue

        category_slug = slugify(category_name)
        category, created = Category.objects.get_or_create(slug=category_slug, defaults={"name": category_name})

        for image_file in os.listdir(category_path):
            local_path = os.path.join(category_path, image_file)
            if not os.path.isfile(local_path):
                continue

            # Xác định MIME type từ tên file
            mime_type, _ = mimetypes.guess_type(local_path)
            if not mime_type:
                mime_type = "image/jpeg"  # Mặc định là JPG nếu không xác định được

            s3_path = f"{S3_BASE_PATH}{image_file}"
            print(f"Uploading {local_path} to s3://{S3_BUCKET_NAME}/{s3_path} with MIME type {mime_type}...")

            # Upload lên S3 với đúng Content-Type
            s3_client.upload_file(local_path, S3_BUCKET_NAME, s3_path, ExtraArgs={"ContentType": mime_type})

            image_obj = Image.objects.create(
                user=user_profile,
                file=s3_path,
                title=image_file,
                description=f"Uploaded from {category_name}",
            )

            ImageCategory.objects.create(image=image_obj, category=category)

upload_images()
print("✅ Upload & Database Update Completed!")
