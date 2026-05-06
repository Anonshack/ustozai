from rest_framework import viewsets, permissions, generics, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .models import Category, Course, Module, Lesson, Enrollment, QuizQuestion, QuizAttempt
from .serializers import (
    CategorySerializer, CourseListSerializer, CourseDetailSerializer,
    CourseWriteSerializer, ModuleSerializer, LessonSerializer, EnrollmentSerializer,
    QuizQuestionSerializer, QuizQuestionWriteSerializer,
    QuizSubmitSerializer, QuizAttemptResultSerializer,
)
from .quiz_service import submit_quiz


class IsTeacherOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ("teacher", "admin")

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, "teacher"):
            return obj.teacher == request.user or request.user.role == "admin"
        return request.user.role == "admin"


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)


class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = (IsTeacherOrReadOnly,)
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ("level", "language", "category", "is_published")
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "price")

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Course.objects.none()
        qs = Course.objects.select_related("category", "teacher").prefetch_related("enrollments")
        if self.request.user.is_authenticated and self.request.user.role == "teacher":
            if self.action in ("update", "partial_update", "destroy"):
                return qs.filter(teacher=self.request.user)
        return qs.filter(is_published=True) if not (
            self.request.user.is_authenticated and self.request.user.role in ("teacher", "admin")
        ) else qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CourseDetailSerializer
        if self.action in ("create", "update", "partial_update"):
            return CourseWriteSerializer
        return CourseListSerializer

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user, course=course
        )
        if not created:
            return Response({"detail": "Already enrolled."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)


class ModuleViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = (IsTeacherOrReadOnly,)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Module.objects.none()
        return Module.objects.filter(course_id=self.kwargs["course_pk"])

    def perform_create(self, serializer):
        course = Course.objects.get(pk=self.kwargs["course_pk"])
        serializer.save(course=course)


@extend_schema(
    parameters=[
        OpenApiParameter("course_pk", OpenApiTypes.INT, OpenApiParameter.PATH),
        OpenApiParameter("module_pk", OpenApiTypes.INT, OpenApiParameter.PATH),
    ]
)
class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = (IsTeacherOrReadOnly,)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Lesson.objects.none()
        return Lesson.objects.filter(module_id=self.kwargs["module_pk"])

    def perform_create(self, serializer):
        module = Module.objects.get(pk=self.kwargs["module_pk"])
        serializer.save(module=module)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Enrollment.objects.none()
        return Enrollment.objects.filter(student=self.request.user).select_related("course")


# ── Quiz views ─────────────────────────────────────────────────────────────────

class QuizView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(responses=QuizQuestionSerializer(many=True))
    def get(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(pk=lesson_id, lesson_type=Lesson.Type.QUIZ)
        except Lesson.DoesNotExist:
            return Response({"detail": "Quiz lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        questions = lesson.quiz_questions.prefetch_related("choices")
        return Response(QuizQuestionSerializer(questions, many=True).data)


class QuizManageView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(request=QuizQuestionWriteSerializer, responses=QuizQuestionSerializer)
    def post(self, request, lesson_id):
        if request.user.role not in ("teacher", "admin"):
            return Response({"detail": "Only teachers can add quiz questions."}, status=status.HTTP_403_FORBIDDEN)
        try:
            lesson = Lesson.objects.get(pk=lesson_id, lesson_type=Lesson.Type.QUIZ)
        except Lesson.DoesNotExist:
            return Response({"detail": "Quiz lesson not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizQuestionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.save(lesson=lesson)
        return Response(QuizQuestionSerializer(question).data, status=status.HTTP_201_CREATED)


class QuizSubmitView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(request=QuizSubmitSerializer, responses=QuizAttemptResultSerializer)
    def post(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(pk=lesson_id, lesson_type=Lesson.Type.QUIZ)
        except Lesson.DoesNotExist:
            return Response({"detail": "Quiz lesson not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt = submit_quiz(
            student=request.user,
            lesson=lesson,
            answers_data=serializer.validated_data["answers"],
        )
        return Response(QuizAttemptResultSerializer(attempt).data, status=status.HTTP_201_CREATED)


class MyQuizAttemptsView(generics.ListAPIView):
    serializer_class = QuizAttemptResultSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return QuizAttempt.objects.none()
        return QuizAttempt.objects.filter(
            student=self.request.user,
            lesson_id=self.kwargs["lesson_id"],
        ).prefetch_related("answers__question__choices", "answers__chosen_choice")
