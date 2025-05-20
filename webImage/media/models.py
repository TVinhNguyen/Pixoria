import os
from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now
from django.utils.timesince import timesince
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from imageretrieval.incremental_update import IndexUpdater
from clip_retrieval.clip_search import CLIPImageSearch
from pathlib import Path


def user_directory_path(instance, filename):
    """ Đường dẫn upload ảnh theo user: media/user_<id>/<filename> """
    return f'image/{filename}'


# Đường dẫn đến file index và mapping
INDEX_DIR = settings.INDEX_DIR
INDEX_PATH = os.path.join(settings.INDEX_DIR, "photo_index.faiss")
MAPPING_PATH = os.path.join(settings.INDEX_DIR, "photo_mapping.pkl")

INDEX_CLIP_DIR = settings.INDEX_CLIP_DIR
INDEX_CLIP_PATH = os.path.join(settings.INDEX_CLIP_DIR, "photo_index_clip.faiss")
MAPPING_CLIP_PATH = os.path.join(settings.INDEX_CLIP_DIR, "photo_mapping_clip.pkl")

# Replace the module-level instantiation with a function to get the singleton instance
def get_clip_search():
    return CLIPImageSearch.get_instance()

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
                print(f"✅ Loaded existing ResNet50 index with {_updater_instance.index.ntotal} images")
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
        """ Tự động cập nhật số lượng ảnh khi lưu và xử lý thay đổi is_public """
        # Kiểm tra nếu đây là cập nhật (không phải tạo mới) 
        # và trạng thái is_public đã thay đổi
        is_update = self.pk is not None
        
        if is_update:
            try:
                old_instance = Image.objects.get(pk=self.pk)
                was_public = old_instance.is_public
                
                # Xử lý thay đổi trạng thái is_public
                if was_public != self.is_public:
                    if self.is_public:
                        # Ảnh từ private -> public: thêm vào index
                        self._add_to_indices()
                    else:
                        # Ảnh từ public -> private: xóa khỏi index
                        self._remove_from_indices()
            except Exception as e:
                print(f"Lỗi khi kiểm tra thay đổi is_public: {e}")
        
        # Lưu bình thường
        super().save(*args, **kwargs)
        self.user.update_counts()
        
        # Cache ảnh khi lưu
        from django.core.cache import cache
        cache_key = f'image:{self.id}'
        cache.set(cache_key, self, 60*60*24)  # Cache trong 24 giờ
    
    def _add_to_indices(self):
        """Thêm ảnh vào các index tìm kiếm"""
        # Thêm vào CLIP index
        try:
            get_clip_search().update_index_for_image(self.id)
            print(f"✅ Added image #{self.id} to CLIP index due to visibility change")
        except Exception as e:
            print(f"❌ Error adding image #{self.id} to CLIP index: {e}")
            
        # Thêm vào ResNet50 index
        try:
            updater = get_updater()
            updated = updater.update_index([self], batch_size=1)
            if updated > 0:
                updater.save(INDEX_PATH, MAPPING_PATH)
                print(f"✅ Added image #{self.id} to ResNet50 index due to visibility change")
        except Exception as e:
            print(f"❌ Error adding image #{self.id} to ResNet50 index: {e}")
      def _remove_from_indices(self):
        """Xóa ảnh khỏi các index tìm kiếm"""
        # Xóa khỏi CLIP index
        try:
            get_clip_search().remove_from_index(self.id)
            print(f"✅ Removed image #{self.id} from CLIP index due to visibility change")
        except Exception as e:
            print(f"❌ Error removing image #{self.id} from CLIP index: {e}")
            
        # Xóa khỏi ResNet50 index
        try:
            updater = get_updater()
            removed = updater.remove_from_index([self.id])
            if removed > 0:
                updater.save(INDEX_PATH, MAPPING_PATH)
                print(f"✅ Removed image #{self.id} from ResNet50 index due to visibility change")
        except Exception as e:
            print(f"❌ Error removing image #{self.id} from ResNet50 index: {e}")
    
    def like_image(self, user_profile):
            updater = get_updater()
            updated = updater.update_index([self], batch_size=1)
            if updated > 0:
                updater.save(INDEX_PATH, MAPPING_PATH)
                print(f"✅ Added image #{self.id} to ResNet50 index due to visibility change")
        except Exception as e:
            print(f"❌ Error adding image #{self.id} to ResNet50 index: {e}")
    
    def _remove_from_indices(self):
        """Xóa ảnh khỏi các index tìm kiếm"""
        # Xóa khỏi CLIP index
        try:
            get_clip_search().remove_from_index(self.id)
            print(f"✅ Removed image #{self.id} from CLIP index due to visibility change")
        except Exception as e:
            print(f"❌ Error removing image #{self.id} from CLIP index: {e}")
            
        # Xóa khỏi ResNet50 index
        try:
            updater = get_updater()
            removed = updater.remove_from_index([self.id])
            if removed > 0:
                updater.save(INDEX_PATH, MAPPING_PATH)
                print(f"✅ Removed image #{self.id} from ResNet50 index due to visibility change")
        except Exception as e:
            print(f"❌ Error removing image #{self.id} from ResNet50 index: {e}")
    
    def like_image(self, user_profile):
        """ Hàm xử lý khi user like ảnh sử dụng Redis để cải thiện hiệu suất với fallback """
        try:
            from django.core.cache import cache
            
            # Tạo các key cho Redis
            like_key = f'user:{user_profile.id}:liked:{self.id}'
            image_likes_key = f'image:{self.id}:likes'
            
            # Thử kiểm tra trong Redis cache
            try:
                # Kiểm tra xem người dùng đã like chưa thông qua Redis
                if cache.get(like_key):
                    return False  # Đã like trước đó
            except Exception as redis_error:
                print(f"Redis cache không khả dụng khi kiểm tra like: {redis_error}")
                # Tiếp tục và chỉ sử dụng database
            
            # Kiểm tra trong database
            if not LikedImage.objects.filter(user=user_profile, image=self).exists():
                # Tạo bản ghi LikedImage trong database
                LikedImage.objects.create(user=user_profile, image=self)
                
                # Cập nhật số lượt like trong database
                self.likes += 1
                self.save(update_fields=['likes'])
                
                # Thử cập nhật Redis cache nếu có thể
                try:
                    cache.set(like_key, 1, 60*60*24*30)  # Cache trong 30 ngày
                    cache.set(image_likes_key, self.likes, 60*60*24)  # Cache trong 24 giờ
                except Exception as redis_error:
                    print(f"Redis cache không khả dụng khi cập nhật like: {redis_error}")
                    # Bỏ qua lỗi Redis và tiếp tục
                
                return True  # Like thành công
            return False  # Đã like trước đó
        except Exception as e:
            # Ghi lại lỗi và fallback về database
            print(f"Lỗi xử lý like_image: {e}")
            # Kiểm tra database và thực hiện thao tác an toàn
            if not LikedImage.objects.filter(user=user_profile, image=self).exists():
                LikedImage.objects.create(user=user_profile, image=self)
                self.likes += 1
                self.save(update_fields=['likes'])
                return True
            return False

    def unlike_image(self, user_profile):
        """ Hàm xử lý khi user bỏ like ảnh sử dụng Redis để cải thiện hiệu suất với fallback"""
        try:
            from django.core.cache import cache
            
            # Tạo các key cho Redis
            like_key = f'user:{user_profile.id}:liked:{self.id}'
            image_likes_key = f'image:{self.id}:likes'
            
            # Xoá like khỏi database
            liked_image = LikedImage.objects.filter(user=user_profile, image=self)
            if liked_image.exists():
                liked_image.delete()
                
                # Cập nhật số lượt like trong database
                self.likes = max(0, self.likes - 1)  # Đảm bảo likes không âm
                self.save(update_fields=['likes'])
                
                # Thử cập nhật Redis cache nếu có thể
                try:
                    cache.delete(like_key)
                    cache.set(image_likes_key, self.likes, 60*60*24)  # Cache trong 24 giờ
                except Exception as redis_error:
                    print(f"Redis cache không khả dụng khi cập nhật unlike: {redis_error}")
                    # Bỏ qua lỗi Redis và tiếp tục
                
                return True  # Bỏ like thành công
            return False  # Ảnh chưa được like trước đó
        except Exception as e:
            # Ghi lại lỗi và fallback về database
            print(f"Lỗi xử lý unlike_image: {e}")
            # Kiểm tra database và thực hiện thao tác an toàn
            liked_image = LikedImage.objects.filter(user=user_profile, image=self)
            if liked_image.exists():
                liked_image.delete()
                self.likes = max(0, self.likes - 1)
                self.save(update_fields=['likes'])
                return True
            return False


@receiver(post_save, sender=Image)
def update_clip_index(sender, instance, created, **kwargs):
    """Update both CLIP and ResNet50 indices when a new image is added"""
    if created and instance.is_public:  # Only process if the image is newly created and public
        # Update CLIP index
        try:
            get_clip_search().update_index_for_image(instance.id)
            print(f"✅ Successfully added image #{instance.id} to the CLIP index")
        except Exception as e:
            print(f"❌ Error updating CLIP index for image #{instance.id}: {e}")
        
        # Update ResNet50 index
        try:
            updater = get_updater()
            # Create a list with just this image
            updated = updater.update_index([instance], batch_size=1)
            if updated > 0:
                # Save the updated index if successful
                updater.save(INDEX_PATH, MAPPING_PATH)
                print(f"✅ Successfully added image #{instance.id} to the ResNet50 index")
            else:
                print(f"⚠️ Failed to add image #{instance.id} to the ResNet50 index")
        except Exception as e:
            print(f"❌ Error updating ResNet50 index for image #{instance.id}: {e}")


@receiver(post_delete, sender=Image)
def remove_image_from_index(sender, instance, **kwargs):
    """Remove image from both CLIP and ResNet50 indices when it is deleted"""
    if instance.is_public:  # Only process if the image is public
        # Remove from CLIP index
        try:
            get_clip_search().remove_from_index(instance.id)
            print(f"✅ Successfully removed image #{instance.id} from the CLIP index")
        except Exception as e:
            print(f"❌ Error removing image #{instance.id} from the CLIP index: {e}")
        
        # Remove from ResNet50 index
        try:
            updater = get_updater()
            removed = updater.remove_from_index([instance.id])
            if removed > 0:
                # Save the updated index if successful
                updater.save(INDEX_PATH, MAPPING_PATH)
                print(f"✅ Successfully removed image #{instance.id} from the ResNet50 index")
            else:
                print(f"⚠️ Image #{instance.id} not found in the ResNet50 index")
        except Exception as e:
            print(f"❌ Error removing image #{instance.id} from the ResNet50 index: {e}")

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
    cover_image = models.URLField(max_length=500, blank=True, null=True)

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
        ordering = ['id']

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
        ('download', 'Download'),
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
        unique_together = ('user', 'image')
        ordering = ['-liked_at']

    def __str__(self):
        return f"{self.user.user.username} liked {self.image.title or 'Untitled'}"

class DownloadedImage(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="downloaded_images")
    image = models.ForeignKey(Image, on_delete=models.CASCADE, related_name="downloaded_by")
    downloaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'image')
        ordering = ['-downloaded_at']

    def __str__(self):
        return f"{self.user.user.username} downloaded {self.image.title or 'Untitled'}"
