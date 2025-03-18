from django.contrib import admin
from django.utils.html import format_html
from .models import UserProfile, Category, Image, ImageCategory, Notification


# Hiển thị avatar dưới dạng ảnh trong admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'display_name', 'avatar_preview', 'created_at')
    search_fields = ('user__username', 'display_name')
    ordering = ('-created_at',)
    readonly_fields = ('avatar_preview', 'created_at')

    def avatar_preview(self, obj):
        """ Hiển thị avatar trong Admin """
        if obj.avatar:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 5px;" />', obj.avatar.url)
        return "No Image"

    avatar_preview.short_description = "Avatar"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'file_preview', 'title', 'created_at', 'is_public', 'likes', 'downloads')
    search_fields = ('user__username', 'title', 'file')
    list_filter = ('is_public', 'user')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'file_preview')

    def file_preview(self, obj):
        """ Hiển thị ảnh trong Admin """
        if obj.file:
            return format_html('<img src="{}" width="75" height="75" style="border-radius: 5px;" />', obj.file.url)
        return "No Image"

    file_preview.short_description = "Preview"


@admin.register(ImageCategory)
class ImageCategoriesAdmin(admin.ModelAdmin):
    list_display = ('id', 'image', 'category')
    search_fields = ('image__title', 'category__name')
    ordering = ('image',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_sender', 'get_recipient', 'type', 'content_preview', 'is_read', 'sent_at')
    search_fields = ('sender__user__username', 'recipient__user__username', 'content')  
    list_filter = ('type', 'is_read')
    ordering = ('-sent_at',)

    def get_sender(self, obj):
        """ Hiển thị username của người gửi """
        return obj.sender.user.username

    get_sender.short_description = "Sender"

    def get_recipient(self, obj):
        """ Hiển thị username của người nhận """
        return obj.recipient.user.username

    get_recipient.short_description = "Recipient"

    def content_preview(self, obj):
        """ Hiển thị nội dung thông báo rút gọn """
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

    content_preview.short_description = "Content"
