from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action
from django.contrib.auth.models import User
from .models import Category, Image, Collection, UserProfile, CollectionImage, ImageCategory, Notification
from .serializers import (
    CategorySerializer, ImageSerializer, CollectionSerializer, 
    UserSerializer, RegisterSerializer, UserProfileSerializer, 
    CollectionImagesSerializer, ImagesCategorySerializer, NotificationSerializer
)

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
        """API để user lấy thông tin cá nhân"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        print("User:", self.request.user)  # Debug xem user có đúng không
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
        user_profiles = UserProfile.objects.filter(user=user)
        if not user_profiles.exists():
            return Response({'error': 'UserProfile not found'}, status=status.HTTP_404_NOT_FOUND)
        user_profile = user_profiles.first()
        serializer = self.get_serializer(user_profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Danh mục API
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

# Hình ảnh API (Chỉ chủ sở hữu có thể sửa/xóa)
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
            return Image.objects.filter(user=self.request.user)
        return Image.objects.filter(is_public=True) 
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # Gán user khi tạo ảnh

    @action(detail=False, permission_classes=[AllowAny])
    def public_images(self, request):
        queryset = Image.objects.filter(is_public=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# Bộ sưu tập API (Chỉ chủ sở hữu có thể sửa/xóa)
class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Collection.objects.filter(is_public=True) | Collection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response({"error": "Bạn không có quyền chỉnh sửa bộ sưu tập này"}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response({"error": "Bạn không có quyền xóa bộ sưu tập này"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

# API quản lý hình ảnh trong bộ sưu tập
class CollectionImagesViewSet(viewsets.ModelViewSet):
    queryset = CollectionImage.objects.all()
    serializer_class = CollectionImagesSerializer
    permission_classes = [IsAuthenticated]

# API quản lý danh mục của hình ảnh
class ImagesCategoryViewSet(viewsets.ModelViewSet):
    queryset = ImageCategory.objects.all()
    serializer_class = ImagesCategorySerializer
    permission_classes = [IsAuthenticated]

# API quản lí các notification
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='get-notification')
    def get_notification_by_userId(self, request):
        userId = request.query_params.get('userid')
        if not userId:
            return Response({'error': 'User ID is required'}, status=400)
        user = get_object_or_404(User, id=userId)
        notifications = Notification.objects.filter(user=user).order_by('-sent_day')
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='mark-all-as-read')
    def mark_all_as_read(self, request):
        userId = request.query_params.get('userid')
        if not userId:
            return Response({'error': 'UserID is required!'}, status=400)
        user = get_object_or_404(User, id=userId)
        notifications = Notification.objects.filter(user=user, is_read=False)
        notifications.update(is_read=True)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['delete'], url_path='delete-all')
    def delete_all_notifications(self, request):
        userId = request.query_params.get('userid')
        if not userId:
            return Response({'error': 'UserID is required!'}, status=400)
        user = get_object_or_404(User, id=userId)
        notifications = Notification.objects.filter(user=user)
        if not notifications.exists():
            return Response({'error': 'No notifications to delete!'}, status=200)
        notifications.delete()
        return Response(status=status.HTTP_200_OK)