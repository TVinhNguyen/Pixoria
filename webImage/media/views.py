from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action
from django.contrib.auth.models import User
from .models import Category, Image, Collection, UserProfile, CollectionImage, ImageCategory
from .serializers import (
    CategorySerializer, ImageSerializer, CollectionSerializer, 
    UserSerializer, RegisterSerializer, UserProfileSerializer, 
    CollectionImagesSerializer, ImagesCategorySerializer
)

# Đăng ký người dùng
class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# Người dùng API
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='get-user')
    def get_user_by_username(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=400)
        user = get_object_or_404(User, username=username)
        serializer = self.get_serializer(user)
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
