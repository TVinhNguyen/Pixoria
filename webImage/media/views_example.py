from django.shortcuts import render, redirect
from .models import Image
from .utils import create_notification

def like_image(request, image_id):
    """View xử lý like ảnh"""
    if request.method == 'POST':
        image = Image.objects.get(id=image_id)
        # Xử lý logic like
        
        # Tạo thông báo
        create_notification(
            sender_profile=request.user.userprofile,
            recipient_profile=image.user,
            notification_type='like',
            content=f"liked your photo {image.title or 'Untitled'}"
        )
        
        return redirect('image_detail', image_id=image_id)