from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .models import User
from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    AdminUserSerializer, CustomTokenObtainPairSerializer,
)


class IsSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserProfileSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (permissions.AllowAny,)


class LogoutView(APIView):
    @extend_schema(
        request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}},
        responses={200: OpenApiResponse(description="Logged out successfully.")},
    )
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logged out successfully."})
        except Exception:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


# ── Admin / Superuser views ────────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = (IsSuperuser,)
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("email", "first_name", "last_name", "username")
    ordering_fields = ("date_joined", "role")

    def get_queryset(self):
        qs = User.objects.all().order_by("-date_joined")
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = (IsSuperuser,)
    queryset = User.objects.all()

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class AdminAssignRoleView(APIView):
    permission_classes = (IsSuperuser,)

    @extend_schema(
        request={"application/json": {"type": "object", "properties": {"role": {"type": "string"}}}},
        responses={200: AdminUserSerializer},
    )
    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        role = request.data.get("role")
        if role not in ("student", "teacher", "admin"):
            return Response({"detail": "Invalid role. Use: student, teacher, admin."}, status=status.HTTP_400_BAD_REQUEST)
        if user.is_superuser:
            return Response({"detail": "Cannot change superuser role."}, status=status.HTTP_400_BAD_REQUEST)
        user.role = role
        user.save(update_fields=["role"])
        return Response(AdminUserSerializer(user).data)


class AdminToggleActiveView(APIView):
    permission_classes = (IsSuperuser,)

    @extend_schema(responses={200: AdminUserSerializer})
    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        if user.is_superuser:
            return Response({"detail": "Cannot deactivate superuser."}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response(AdminUserSerializer(user).data)


class AdminStatsView(APIView):
    permission_classes = (IsSuperuser,)

    def get(self, request):
        from apps.courses.models import Course, Enrollment
        from apps.chat.models import Conversation
        return Response({
            "total_users": User.objects.count(),
            "total_students": User.objects.filter(role="student").count(),
            "total_teachers": User.objects.filter(role="teacher").count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "total_courses": Course.objects.count(),
            "published_courses": Course.objects.filter(is_published=True).count(),
            "total_enrollments": Enrollment.objects.count(),
            "total_conversations": Conversation.objects.count(),
            "flagged_conversations": Conversation.objects.filter(is_flagged=True).count(),
        })


class AdminFlaggedConversationsView(generics.ListAPIView):
    permission_classes = (IsSuperuser,)

    def get_queryset(self):
        from apps.chat.models import Conversation
        return Conversation.objects.filter(is_flagged=True).select_related("student").order_by("-updated_at")

    def list(self, request, *args, **kwargs):
        from apps.chat.models import Conversation
        qs = self.get_queryset()
        data = [
            {
                "id": c.id,
                "student_email": c.student.email,
                "student_name": c.student.full_name,
                "title": c.title,
                "flag_reason": c.flag_reason,
                "updated_at": c.updated_at,
            }
            for c in qs
        ]
        return Response(data)


class AdminConversationListView(generics.ListAPIView):
    permission_classes = (IsSuperuser,)

    def get_queryset(self):
        from apps.chat.models import Conversation
        return Conversation.objects.select_related("student").order_by("-updated_at")

    def list(self, request, *args, **kwargs):
        from apps.chat.models import Conversation
        qs = self.get_queryset()
        student_id = request.query_params.get("student_id")
        flagged = request.query_params.get("flagged")
        if student_id:
            qs = qs.filter(student_id=student_id)
        if flagged == "true":
            qs = qs.filter(is_flagged=True)
        data = [
            {
                "id": c.id,
                "student_email": c.student.email,
                "student_name": c.student.full_name,
                "title": c.title,
                "is_flagged": c.is_flagged,
                "flag_reason": c.flag_reason,
                "message_count": c.messages.count(),
                "updated_at": c.updated_at,
            }
            for c in qs[:50]
        ]
        return Response(data)


class AdminDeleteConversationView(APIView):
    permission_classes = (IsSuperuser,)

    def delete(self, request, pk):
        from apps.chat.models import Conversation
        try:
            conv = Conversation.objects.get(pk=pk)
        except Conversation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCourseListView(generics.ListAPIView):
    permission_classes = (IsSuperuser,)

    def get_queryset(self):
        from apps.courses.models import Course
        return Course.objects.select_related("category", "teacher").order_by("-created_at")

    def list(self, request, *args, **kwargs):
        from apps.courses.models import Course
        qs = self.get_queryset()
        data = [
            {
                "id": c.id,
                "title": c.title,
                "teacher_name": c.teacher.full_name,
                "teacher_email": c.teacher.email,
                "level": c.level,
                "is_published": c.is_published,
                "enrollment_count": c.enrollments.count(),
                "created_at": c.created_at,
            }
            for c in qs
        ]
        return Response(data)


class AdminToggleCoursePublishView(APIView):
    permission_classes = (IsSuperuser,)

    def post(self, request, pk):
        from apps.courses.models import Course
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        course.is_published = not course.is_published
        course.save(update_fields=["is_published"])
        return Response({"id": course.id, "is_published": course.is_published})
