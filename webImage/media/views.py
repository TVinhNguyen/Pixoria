from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import CreateAPIView

from .models import Category, Image, UserProfile, ImageCategory, Notification, Collection
from .serializers import (
    CategorySerializer, ImageSerializer, CollectionSerializer,
    UserSerializer, RegisterSerializer, UserProfileSerializer, 
    ImagesCategorySerializer, NotificationSerializer
)
# Import hàm tiện ích để tạo thông báo
from .utils import create_notification

# Các ViewSet khác giữ nguyên...

class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        if self.request.user.is_superuser:  
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)  

    def get_permissions(self):
        if self.action in ['create', 'get_user_by_username']: 
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]  

    def perform_create(self, serializer):
        user = serializer.save()
        user.set_password(user.password)
        user.save()

    def perform_update(self, serializer):
        user = serializer.instance
        password = serializer.validated_data.get("password", None)
        if password:
            user.set_password(password)
        serializer.save()

    @action(detail=False, methods=['get'], url_path='get-user')
    def get_user_by_username(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=400)
        user = get_object_or_404(User, username=username)
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user).order_by("id")

    def perform_update(self, serializer):
        if self.request.user != serializer.instance.user:
            return Response({"error": "Bạn không có quyền chỉnh sửa hồ sơ này"}, status=403)
        serializer.save()

    @action(detail=False, methods=['get'], url_path='get-profile')
    def get_profile_by_username(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        user = get_object_or_404(User, username=username)
        user_profile = UserProfile.objects.filter(user=user).first()
        if not user_profile:
            return Response({'error': 'UserProfile not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(user_profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Collection.objects.filter(Q(is_public=True) | Q(user=user_profile))

    def check_object_permissions(self, request, obj):
        if obj.user != request.user.userprofile:
            self.permission_denied(request, message="Bạn không có quyền thực hiện thao tác này.")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user.userprofile)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_object_permissions(request, instance)
        return super().destroy(request, *args, **kwargs)
    
class ImageViewSet(viewsets.ModelViewSet):
    serializer_class = ImageSerializer
    def get_permissions(self):
        if self.action in ["public_images", "list"]:  
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            public = self.request.query_params.get("public", None)
            if public and public.lower() == "true":
                return Image.objects.filter(is_public=True)
            return Image.objects.filter(user=self.request.user.userprofile)
        return Image.objects.filter(is_public=True) 
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user.userprofile)

    @action(detail=False, permission_classes=[AllowAny])
    def public_images(self, request):
        queryset = Image.objects.filter(is_public=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # Thêm action cho like ảnh và tạo thông báo
    @action(detail=True, methods=['post'], url_path='like')
    def like_image(self, request, pk=None):
        """API endpoint để like ảnh và tạo thông báo"""
        image = self.get_object()
        # Xử lý logic like ở đây (thêm vào model Like nếu có)
        image.likes += 1
        image.save()
        
        # Tạo thông báo cho chủ sở hữu ảnh
        if image.user != request.user.userprofile:
            create_notification(
                sender_profile=request.user.userprofile,
                recipient_profile=image.user,
                notification_type='like',
                content=f"liked your photo '{image.title or 'Untitled'}'"
            )
        
        return Response({"status": "success", "likes": image.likes})
    
    # Thêm action cho comment ảnh và tạo thông báo
    @action(detail=True, methods=['post'], url_path='comment')
    def comment_image(self, request, pk=None):
        """API endpoint để comment ảnh và tạo thông báo"""
        image = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({
                "error": "Comment content is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Xử lý logic comment ở đây (thêm vào model Comment nếu có)
        # comment = Comment.objects.create(...)
        
        # Tạo thông báo cho chủ sở hữu ảnh
        if image.user != request.user.userprofile:
            create_notification(
                sender_profile=request.user.userprofile,
                recipient_profile=image.user,
                notification_type='comment',
                content=f"commented on your photo: '{content[:30]}...'" if len(content) > 30 else f"commented on your photo: '{content}'"
            )
        
        return Response({"status": "success", "message": "Comment posted successfully"})

class ImagesCategoryViewSet(viewsets.ModelViewSet):
    queryset = ImageCategory.objects.all()
    serializer_class = ImagesCategorySerializer
    permission_classes = [IsAuthenticated]

class NotificationViewSet(mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin,
                          viewsets.GenericViewSet):
    """
    ViewSet cho Notification.
    Chỉ cho phép list, retrieve và update (để đánh dấu đã đọc)
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user.userprofile)

    @action(detail=False, methods=['get'], url_path='get-notifications')
    def get_notifications(self, request):
        """Lấy tất cả thông báo của người dùng hiện tại"""
        notifications = self.get_queryset().order_by('-sent_at')
        
        # Thêm tùy chọn giới hạn số lượng thông báo
        limit = request.query_params.get('limit')
        if limit and limit.isdigit():
            notifications = notifications[:int(limit)]
            
        # Thêm tùy chọn chỉ lấy thông báo chưa đọc
        unread_only = request.query_params.get('unread')
        if unread_only and unread_only.lower() == 'true':
            notifications = notifications.filter(is_read=False)
        
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """API endpoint để đánh dấu một thông báo là đã đọc"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'], url_path='mark-all-as-read')
    def mark_all_as_read(self, request):
        """API endpoint để đánh dấu tất cả thông báo là đã đọc"""
        notifications = self.get_queryset()
        notifications.update(is_read=True)
        return Response({"status": "success", "message": "All notifications marked as read"})
    
    @action(detail=False, methods=['get'], url_path='count')
    def get_notification_count(self, request):
        """API endpoint để lấy số lượng thông báo chưa đọc"""
        unread_count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": unread_count})
    
    # Vô hiệu hóa các phương thức tạo và xoá thông báo qua API
    def create(self, request, *args, **kwargs):
        return Response(
            {"error": "Creating notifications directly is not allowed"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "Deleting notifications is not allowed"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )