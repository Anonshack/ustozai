from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from drf_spectacular.utils import extend_schema_field
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "password", "password2", "language")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        email = validated_data["email"]
        base_username = email.split("@")[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        validated_data["username"] = username
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "first_name", "last_name", "full_name",
            "role", "avatar", "bio", "level", "phone", "language", "date_joined",
            "is_superuser",
        )
        read_only_fields = ("id", "email", "role", "date_joined", "is_superuser")

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj) -> str:
        return obj.full_name


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "full_name", "avatar", "role", "level")

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj) -> str:
        return obj.full_name


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "first_name", "last_name", "full_name",
            "role", "avatar", "level", "phone", "language", "is_active",
            "is_superuser", "date_joined", "last_login",
        )
        read_only_fields = ("id", "email", "username", "date_joined", "last_login", "is_superuser")

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj) -> str:
        return obj.full_name


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user).data
        return data
