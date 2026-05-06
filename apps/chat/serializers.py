from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "role", "content", "created_at")
        read_only_fields = ("id", "role", "created_at")


class ConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("id", "title", "course", "lesson", "last_message", "message_count", "created_at", "updated_at")

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_last_message(self, obj) -> str | None:
        last = obj.messages.last()
        return last.content[:100] if last else None

    @extend_schema_field(serializers.IntegerField())
    def get_message_count(self, obj) -> int:
        return obj.messages.count()


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ("id", "title", "course", "lesson", "messages", "created_at", "updated_at")


class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ("id", "title", "course", "lesson")
        read_only_fields = ("id",)


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(min_length=1, max_length=4000)
