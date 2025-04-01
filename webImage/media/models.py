import os
from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now
from django.utils.timesince import timesince
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from imageretrieval.incremental_update import IndexUpdater
from pathlib import Path


def user_directory_path(instance, filename):
    """ Đường dẫn upload ảnh theo user: media/user_<id>/<filename> """
    return f'image/{filename}'


# Đường dẫn đến file index và mapping
INDEX_DIR = settings.INDEX_DIR
INDEX_PATH = settings.INDEX_DIR / "photo_index.faiss"
MAPPING_PATH = settings.INDEX_DIR / "photo_mapping.pkl"

# Singleton pattern để giữ updater trong bộ nhớ
_updater_instance = None

def get_updater():
    global _updater_instance
    if _updater_instance is None:
        _updater_instance = IndexUpdater()
        # Tạo thư mục nếu chưa tồn tại
        os.makedirs(INDEX_DIR, exist_ok=True)
        # Nếu index đã tồn tại, load nó
        if os.path.exists(INDEX_PATH) and os.path.exists(MAPPING_PATH):
            try:
                _updater_instance.load(INDEX_PATH, MAPPING_PATH)
            except Exception as e:
                print(f"⚠️ Không thể load index: {e}. Tạo index mới.")
    return _updater_instance


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="userprofile")
    display_name = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', default='default/avatar.jpg')
    social_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Thêm mới: Tự động cập nhật số lượng
    photos_count = models.PositiveIntegerField(default=0)
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.display_name if self.display_name else self.user.username

    def update_counts(self):
        """ Cập nhật số lượng ảnh, followers và following """
        self.photos_count = self.images.count()
        self.followers_count = self.followers.count()
        self.following_count = self.following.count()
        self.save()


class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Image(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="images")
    file = models.ImageField(upload_to=user_directory_path)
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=True)
    likes = models.PositiveIntegerField(default=0)
    downloads = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.user.username} - {self.title or 'Untitled'}"

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        """ Tự động cập nhật số lượng ảnh khi lưu """
        super().save(*args, **kwargs)
        self.user.update_counts()
    
    def like_image(self, user_profile):
        """ Hàm xử lý khi user like ảnh """
        if not LikedImage.objects.filter(user=user_profile, image=self).exists():
            LikedImage.objects.create(user=user_profile, image=self)  # Thêm vào danh sách like
            self.likes += 1  # Tăng số lượt like
            self.save()
            return True  # Like thành công
        return False  # Đã like trước đó

    def unlike_image(self, user_profile):
        """ Hàm xử lý khi user bỏ like ảnh """
        liked_image = LikedImage.objects.filter(user=user_profile, image=self)
        if liked_image.exists():
            liked_image.delete()  # Xóa khỏi danh sách like
            self.likes -= 1  # Giảm số lượt like
            self.save()
            return True  # Bỏ like thành công
        return False  # Ảnh chưa được like trước đó


@receiver(post_save, sender=Image)
def update_image_index(sender, instance, created, **kwargs):
    """Signal handler để cập nhật index khi có ảnh mới được tạo"""
    if created and instance.is_public:  # Chỉ xử lý khi ảnh mới công khai được tạo
        try:
            updater = get_updater()
            updater.update_index([instance])
            # Lưu index và mapping sau khi cập nhật
            updater.save(INDEX_PATH, MAPPING_PATH)
            print(f"✅ Đã thêm ảnh #{instance.id} vào index")
        except Exception as e:
            print(f"❌ Lỗi khi cập nhật index: {e}")


@receiver(post_delete, sender=Image)
def remove_image_from_index(sender, instance, **kwargs):
    """Signal handler để xóa ảnh khỏi index khi ảnh bị xóa"""
    if instance.is_public:  # Chỉ xử lý ảnh công khai
        try:
            updater = get_updater()
            updater.remove_from_index([instance.id])
            # Lưu index và mapping sau khi cập nhật
            updater.save(INDEX_PATH, MAPPING_PATH)
            print(f"✅ Đã xóa ảnh #{instance.id} khỏi index")
        except Exception as e:
            print(f"❌ Lỗi khi xóa ảnh khỏi index: {e}")


class ImageCategory(models.Model):
    image = models.ForeignKey(Image, on_delete=models.CASCADE, related_name="categories")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="images")

    def __str__(self):
        return f"{self.image.title} - {self.category.name}"

    class Meta:
        unique_together = ('image', 'category')
        ordering = ['id']


class Collection(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="collections")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    images = models.ManyToManyField(Image, related_name='collections', blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({'Public' if self.is_public else 'Private'})"

    class Meta:
        ordering = ['-created_at']


class Follow(models.Model):
    follower = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.user.username} follows {self.following.user.username}"

    def save(self, *args, **kwargs):
        """ Tự động cập nhật số lượng followers/following khi có follow mới """
        super().save(*args, **kwargs)
        self.follower.update_counts()
        self.following.update_counts()

    def delete(self, *args, **kwargs):
        """ Tự động cập nhật số lượng followers/following khi unfollow """
        super().delete(*args, **kwargs)
        self.follower.update_counts()
        self.following.update_counts()


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('follow', 'Follow'),
        ('mention', 'Mention'),
        ('other', 'Other'),
    ]

    recipient = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name="received_notifications", db_index=True
    )  # Người nhận thông báo
    sender = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name="sent_notifications", db_index=True
    )  # Người gửi thông báo
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='other')
    content = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    sent_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"{self.sender.user.username} {self.content}"

    class Meta:
        ordering = ['-sent_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

class LikedImage(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="liked_images")
    image = models.ForeignKey(Image, on_delete=models.CASCADE, related_name="liked_by")
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'image')  # Đảm bảo mỗi ảnh chỉ được like 1 lần bởi 1 user
        ordering = ['-liked_at']

    def __str__(self):
        return f"{self.user.user.username} liked {self.image.title or 'Untitled'}"