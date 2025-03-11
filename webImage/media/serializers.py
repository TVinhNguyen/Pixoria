from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Image, Category, Collection, UserProfile, CollectionImage, ImageCategory, Notification

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
    user = serializers.ReadOnlyField(source='user.username')
    images = ImageSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = '__all__'

class CollectionImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionImage
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class ImagesCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageCategory
        fields = '__all__'