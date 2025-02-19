# filepath: /d:/vs/django/image/webImage1/webImage/media/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from PIL import Image as PILImage
import os
import mimetypes

# User Model Extension (Assumes Custom User Model or Profile)
class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    avatar = models.URLField(blank=True, null=True)  # URL to S3-hosted avatar
    display_name = models.CharField(max_length=100)
    social_link = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.display_name or self.username

# Categories
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return f'user_{instance.user.id}/{filename}'

class Image(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="images")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    file_name = models.CharField(max_length=255)
    file = models.ImageField(upload_to=user_directory_path, storage=default_storage, default='path/to/default/image.jpg')  # Use ImageField for image files
    file_size = models.IntegerField()  # Size in bytes
    resolution = models.CharField(max_length=50)  # Example: "1920x1080"
    mime_type = models.CharField(max_length=50)
    likes = models.IntegerField(default=0)
    downloads = models.IntegerField(default=0)
    is_public = models.BooleanField(default=True)  # Allows others to view/download
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Set file_size
        self.file_size = self.file.size

        # Set mime_type
        self.mime_type = mimetypes.guess_type(self.file.name)[0]

        # Set resolution
        image = PILImage.open(self.file)
        self.resolution = f"{image.width}x{image.height}"

        super().save(*args, **kwargs)

    def can_edit(self, user):
        return self.user == user

    def __str__(self):
        return self.file_name

# Collections
class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="collections")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    images = models.ManyToManyField(Image, related_name="collections")
    created_at = models.DateTimeField(auto_now_add=True)

    def can_edit(self, user):
        return self.user == user

    def __str__(self):
        return self.name