import os
from django.db import models
from django.contrib.auth.models import User


def user_directory_path(instance, filename):
    """ Đường dẫn upload ảnh theo user: media/user_<id>/<filename> """
    return f'user_{instance.user.id}/{filename}'


class UserProfile(models.Model):
    """ Hồ sơ người dùng, mở rộng từ Django User """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', default='default/avatar.jpg')
    social_link = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.display_name if self.display_name else self.user.username


class Category(models.Model):
    """ Danh mục ảnh """
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Image(models.Model):
    """ Model ảnh, chỉ chủ sở hữu mới có thể chỉnh sửa hoặc xóa """
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Ảnh thuộc về 1 user
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    file = models.ImageField(upload_to=user_directory_path)
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=True)  # Công khai hay không
    likes = models.PositiveIntegerField(default=0)
    downloads = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled'}"

    class Meta:
        ordering = ['-created_at']


class Collection(models.Model):
    """ Bộ sưu tập ảnh do người dùng tạo """
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Collection thuộc về user
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    images = models.ManyToManyField(Image, related_name='collections', blank=True)
    is_public = models.BooleanField(default=False)  # Mặc định là riêng tư
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({'Public' if self.is_public else 'Private'})"

    class Meta:
        ordering = ['-created_at']
