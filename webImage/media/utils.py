from .models import Notification

def create_notification(sender_profile, recipient_profile, notification_type, content):
 
    # Kiểm tra null
    if not sender_profile or not recipient_profile:
        print("Error: Both sender and recipient are required")
        return None
    
    # Tránh gửi thông báo cho chính mình
    if sender_profile == recipient_profile:
        return None
    
    try:
        notification = Notification(
            sender=sender_profile,
            recipient=recipient_profile,
            type=notification_type,
            content=content
        )
        notification.save()
        return notification
    except Exception as e:
        print(f"Error creating notification: {str(e)}")
        return None