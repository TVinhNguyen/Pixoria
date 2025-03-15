from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Image, Category, Collection, UserProfile, ImageCategory, Notification
from django.utils.timesince import timesince

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},  
        }

    def update(self, instance, validated_data):
        """Xử lý cập nhật User (bao gồm đổi mật khẩu nếu có)"""
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password) 
        return super().update(instance, validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        UserProfile.objects.create(user=user)
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ImageSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Image
        fields = '__all__'

    def validate(self, data):
        if 'file' in data:
            if data['file'].size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Ảnh không được lớn hơn 5MB!")
        return data
class CollectionSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.user.username', read_only=True)  
    images = serializers.PrimaryKeyRelatedField(
        queryset=Image.objects.all(), many=True, required=False
    )  # Cho phép danh sách ID của images, không bắt buộc

    class Meta:
        model = Collection
        fields = ['id', 'user', 'name', 'description', 'images', 'is_public', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def validate_images(self, value):
        """Chặn người dùng thêm ảnh không phải của họ vào bộ sưu tập riêng tư"""
        user_profile = self.context['request'].user.userprofile
        for image in value:
            if not image.is_public and image.user != user_profile:
                raise serializers.ValidationError("Bạn không thể thêm ảnh riêng tư của người khác vào bộ sưu tập.")
        return value


class NotificationSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    userAvatar = serializers.CharField(source='user.profile.avatar.url', read_only=True)
    userAvatar = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'user', 'userAvatar', 'content', 'time', 'is_read']

    def get_time(self, obj):
        return timesince(obj.sent_day) + " ago"  


class ImagesCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageCategory
        fields = '__all__'
