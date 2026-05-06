from django.utils import timezone
from rest_framework import generics, views, permissions, status
from rest_framework.response import Response
from .models import LessonProgress, CourseProgress, WeakArea
from .serializers import (
    LessonProgressSerializer, MarkLessonCompleteSerializer,
    CourseProgressSerializer, WeakAreaSerializer, WeakAreaCreateSerializer,
)
from apps.courses.models import Lesson


class MarkLessonCompleteView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = MarkLessonCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lesson_id = serializer.validated_data["lesson_id"]
        time_spent = serializer.validated_data["time_spent_seconds"]

        try:
            lesson = Lesson.objects.select_related("module__course").get(pk=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)

        progress, _ = LessonProgress.objects.get_or_create(
            student=request.user, lesson=lesson,
            defaults={"time_spent_seconds": time_spent},
        )

        if not progress.is_completed:
            progress.is_completed = True
            progress.completed_at = timezone.now()
            progress.time_spent_seconds += time_spent
            progress.save(update_fields=["is_completed", "completed_at", "time_spent_seconds"])

            course = lesson.module.course
            total = Lesson.objects.filter(module__course=course).count()
            completed = LessonProgress.objects.filter(
                student=request.user, lesson__module__course=course, is_completed=True
            ).count()
            CourseProgress.objects.update_or_create(
                student=request.user,
                course=course,
                defaults={"total_lessons": total, "completed_lessons": completed},
            )

        return Response(LessonProgressSerializer(progress).data)


class MyCourseProgressView(generics.ListAPIView):
    serializer_class = CourseProgressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return CourseProgress.objects.filter(student=self.request.user).select_related("course")


class CourseLessonProgressView(generics.ListAPIView):
    serializer_class = LessonProgressSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return LessonProgress.objects.filter(
            student=self.request.user,
            lesson__module__course_id=self.kwargs["course_id"],
        ).select_related("lesson")


# ── Weak areas ─────────────────────────────────────────────────────────────────

class MyWeakAreasView(generics.ListAPIView):
    """GET /api/v1/progress/weak-areas/  — student sees their own weak areas."""
    serializer_class = WeakAreaSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        resolved = self.request.query_params.get("resolved", "false").lower() == "true"
        return WeakArea.objects.filter(student=self.request.user, resolved=resolved)


class WeakAreaCreateView(views.APIView):
    """POST /api/v1/progress/weak-areas/create/  — teacher/admin manually adds weak area."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        if request.user.role not in ("teacher", "admin"):
            return Response({"detail": "Only teachers can assign weak areas."}, status=status.HTTP_403_FORBIDDEN)

        serializer = WeakAreaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.users.models import User
        try:
            student = User.objects.get(pk=serializer.validated_data["student_id"])
        except User.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        weak_area, created = WeakArea.objects.get_or_create(
            student=student,
            topic=serializer.validated_data["topic"],
            defaults={"source": WeakArea.Source.MANUAL},
        )
        return Response(WeakAreaSerializer(weak_area).data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class WeakAreaResolveView(views.APIView):
    """POST /api/v1/progress/weak-areas/<id>/resolve/"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            # Student can resolve their own; teacher/admin can resolve anyone's
            if request.user.role in ("teacher", "admin"):
                weak_area = WeakArea.objects.get(pk=pk)
            else:
                weak_area = WeakArea.objects.get(pk=pk, student=request.user)
        except WeakArea.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        weak_area.resolved = True
        weak_area.save(update_fields=["resolved"])
        return Response(WeakAreaSerializer(weak_area).data)
