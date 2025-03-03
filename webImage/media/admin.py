from django.contrib import admin
from .models import UserProfile, Category, Image, Collection

# Quản lý UserProfile trong Admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'bio', 'avatar')  # Chỉ lấy các field có trong model UserProfile
    search_fields = ('user__username',)

# Quản lý Category trong Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)  # Không có 'slug' trong model
    search_fields = ('name',)

# Quản lý Image trong Admin
@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ('user', 'file', 'created_at')  # Chỉ lấy các field có trong model
    search_fields = ('user__username', 'file')
    list_filter = ('user',)  # Không có 'is_public' trong model

# Quản lý Collection trong Admin
@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'is_public', 'created_at')
    search_fields = ('user__username', 'name')
    list_filter = ('is_public',)
