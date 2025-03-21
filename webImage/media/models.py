import os
from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now
from django.utils.timesince import timesince


def user_directory_path(instance, filename):
    """ Đường dẫn upload ảnh theo user: media/user_<id>/<filename> """
    return f'image/{filename}'


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
