from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer, ConversationDetailSerializer,
    ConversationCreateSerializer, MessageSerializer, SendMessageSerializer,
)
from .services import get_ai_response
from .guardrails import is_exam_request, is_rate_limited


class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Conversation.objects.filter(student=self.request.user).prefetch_related("messages")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ConversationDetailSerializer
        if self.action == "create":
            return ConversationCreateSerializer
        return ConversationListSerializer

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=["post"], url_path="send")
    def send_message(self, request, pk=None):
        conversation = self.get_object()

        # Rate limit check
        if is_rate_limited(request.user.id):
            return Response(
                {"detail": "Too many requests. Please slow down and try again in a minute."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_text = serializer.validated_data["message"]

        # Exam / assignment bypass check
        if is_exam_request(user_text):
            # Flag the conversation for instructor review
            if not conversation.is_flagged:
                conversation.is_flagged = True
                conversation.flag_reason = "Possible assignment bypass attempt detected."
                conversation.save(update_fields=["is_flagged", "flag_reason"])

            return Response(
                {
                    "detail": (
                        "Bu so'rov topshiriq/imtihon yechimini so'rayotgandek ko'rinadi. "
                        "Men siz uchun yechim yozmayman — lekin tushuntirib bera olaman. "
                        "Qaysi qism tushunarsiz? / "
                        "Похоже, вы просите решение задания. Я объясню концепцию, но не решу за вас. / "
                        "This looks like an assignment request. I'll teach you the concept instead — what part is unclear?"
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Save student message
        Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=user_text,
        )

        # Get AI response
        try:
            reply, input_tokens, output_tokens = get_ai_response(conversation, user_text)
        except Exception as e:
            return Response(
                {"detail": f"AI service error: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        assistant_msg = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=reply,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

        # Auto-title from first user message
        if conversation.messages.count() <= 2 and not conversation.title:
            conversation.title = user_text[:80]
            conversation.save(update_fields=["title", "updated_at"])

        return Response(MessageSerializer(assistant_msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="messages")
    def list_messages(self, request, pk=None):
        conversation = self.get_object()
        return Response(MessageSerializer(conversation.messages.all(), many=True).data)

    @action(detail=True, methods=["post"], url_path="flag",
            permission_classes=[permissions.IsAdminUser])
    def flag(self, request, pk=None):
        """Instructor manually flags a conversation for review."""
        conversation = self.get_object()
        reason = request.data.get("reason", "Flagged by instructor.")
        conversation.is_flagged = True
        conversation.flag_reason = reason
        conversation.save(update_fields=["is_flagged", "flag_reason"])
        return Response({"detail": "Conversation flagged."})

    @action(detail=True, methods=["post"], url_path="unflag",
            permission_classes=[permissions.IsAdminUser])
    def unflag(self, request, pk=None):
        conversation = self.get_object()
        conversation.is_flagged = False
        conversation.flag_reason = ""
        conversation.save(update_fields=["is_flagged", "flag_reason"])
        return Response({"detail": "Flag removed."})
