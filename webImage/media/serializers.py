from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Image, Category, Collection, UserProfile

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'

# User Registration Serializer
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

# Category Serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

# Image Serializer
class ImageSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Image
        fields = '__all__'

    def validate(self, data):
        if 'file' in data:
            if data['file'].size > 5 * 1024 * 1024:  # Giới hạn 5MB
                raise serializers.ValidationError("Ảnh không được lớn hơn 5MB!")
        return data

# Collection Serializer
class CollectionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    images = ImageSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = '__all__'
