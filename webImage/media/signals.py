from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver

from .models import Image, Follow, Collection, Notification, UserProfile
from .utils import create_notification

@receiver(post_save, sender=Follow)
def create_follow_notification(sender, instance, created, **kwargs):
    """Tạo thông báo khi có người follow mới"""
    if created:
        follower = instance.follower
        following = instance.following
        
        create_notification(
            sender_profile=follower,
            recipient_profile=following,
            notification_type='follow',
            content=f"started following you"
        )

@receiver(post_save, sender=Image)
def create_new_image_notification(sender, instance, created, **kwargs):
    """Thông báo cho người theo dõi khi người dùng đăng ảnh mới (tuỳ chọn)"""
    if created and instance.is_public:
        # Chỉ thông báo cho followers nếu ảnh là public
        user = instance.user
        followers = [follow.follower for follow in user.followers.all()]
        
        for follower in followers:
            create_notification(
                sender_profile=user,
                recipient_profile=follower,
                notification_type='other',
                content=f"uploaded a new photo: {instance.title or 'Untitled'}"
            )

# Thêm các signals khác tùy vào ứng dụng của bạn
# Ví dụ: thông báo like, comment, mention, v.v.