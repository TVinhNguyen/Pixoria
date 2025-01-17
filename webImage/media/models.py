from django.db import models
from django.contrib.auth.models import User

# Categories
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

# Images
class Image(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="images")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    file_name = models.CharField(max_length=255)
    file_url = models.URLField()
    file_size = models.IntegerField()  # Size in bytes
    resolution = models.CharField(max_length=50)  # Example: "1920x1080"
    mime_type = models.CharField(max_length=50)
    likes = models.IntegerField(default=0)
    downloads = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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

    def __str__(self):
        return self.name

# Subscription (Premium Features)
class Subscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="subscription")
    plan = models.CharField(max_length=50, choices=(("Basic", "Basic"), ("Pro", "Pro")))
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()

    def __str__(self):
        return f"{self.user.username} - {self.plan}"
