import os
from django.db import models
from django.contrib.auth.models import User
from django.utils.timezone import now


def user_directory_path(instance, filename):
    """ Đường dẫn upload ảnh theo user: media/user_<id>/<filename> """
    return f'user_{instance.user.id}/{filename}'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', default='default/avatar.jpg')
    social_link = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return self.display_name if self.display_name else self.user.username


class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Image(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.ImageField(upload_to=user_directory_path)
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)  
    is_public = models.BooleanField(default=True)
    likes = models.PositiveIntegerField(default=0)
    downloads = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled'}"

    class Meta:
        ordering = ['-created_at']


class ImageCategory(models.Model):
    image = models.ForeignKey(Image, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.image.title} - {self.category.name}"

    class Meta:
        unique_together = ('image', 'category')


class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    images = models.ManyToManyField(Image, related_name='collections', blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return f"{self.name} ({'Public' if self.is_public else 'Private'})"

    class Meta:
        ordering = ['-created_at']


class CollectionImage(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    image = models.ForeignKey(Image, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.image} belongs to {self.collection}"

    class Meta:
        unique_together = ('collection', 'image')


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    sent_day = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return f"{self.user.username}: {self.message}..."
    
    class Meta:
        ordering = ['-sent_day']