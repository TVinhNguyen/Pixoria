from django.contrib import admin
from .models import (
    UserProfile, Category, Image, ImageCategory, Collection, CollectionImage, Notification
)

# Quản lý UserProfile trong Admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'display_name', 'bio', 'avatar', 'created_at')
    search_fields = ('user__username', 'display_name')
    ordering = ('-created_at',)

# Quản lý Category trong Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    search_fields = ('name',)
    ordering = ('name',)

# Quản lý Image trong Admin
@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'file', 'title', 'created_at', 'is_public', 'likes', 'downloads')
    search_fields = ('user__username', 'title', 'file')
    list_filter = ('is_public', 'user')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

# Quản lý Image - Category liên kết trong Admin
@admin.register(ImageCategory)
class ImageCategoriesAdmin(admin.ModelAdmin):
    list_display = ('id', 'image', 'category')
    search_fields = ('image__title', 'category__name')
    ordering = ('image',)

# Quản lý Collection trong Admin
@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'is_public', 'created_at')
    search_fields = ('user__username', 'name')
    list_filter = ('is_public',)
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

# Quản lý Collection - Image liên kết trong Admin
@admin.register(CollectionImage)
class CollectionImagesAdmin(admin.ModelAdmin):
    list_display = ('id', 'collection', 'image')
    search_fields = ('collection__name', 'image__title')
    ordering = ('collection',)

# Quản lý Notification trong Admin
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'message', 'is_read', 'sent_day')
    search_fields = ('user__username', 'message')
    list_filter = ('is_read',)
    ordering = ('-sent_day',)
