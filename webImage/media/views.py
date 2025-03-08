from rest_framework import viewsets, status
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

# Đăng nhập và lấy JWT Token
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        print(username, password)

        user = User.objects.filter(username=username).first()
        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data
            })
        return Response({"error": "Sai tài khoản hoặc mật khẩu"}, status=status.HTTP_401_UNAUTHORIZED)

# Người dùng API
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Image.objects.filter(user=self.request.user)
    
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
