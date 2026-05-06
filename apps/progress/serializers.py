from rest_framework import serializers
from .models import LessonProgress, CourseProgress, WeakArea


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ("id", "lesson", "is_completed", "completed_at", "time_spent_seconds")
        read_only_fields = ("completed_at",)


class MarkLessonCompleteSerializer(serializers.Serializer):
    lesson_id = serializers.IntegerField()
    time_spent_seconds = serializers.IntegerField(min_value=0, default=0)


class CourseProgressSerializer(serializers.ModelSerializer):
    percentage = serializers.ReadOnlyField()
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = CourseProgress
        fields = (
            "id", "course", "course_title",
            "total_lessons", "completed_lessons", "percentage", "last_accessed_at",
        )


class WeakAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeakArea
        fields = ("id", "topic", "source", "resolved", "created_at")
        read_only_fields = ("source", "resolved", "created_at")


class WeakAreaCreateSerializer(serializers.ModelSerializer):
    """Used by teacher/admin to manually add a weak area for a student."""
    student_id = serializers.IntegerField()

    class Meta:
        model = WeakArea
        fields = ("student_id", "topic", "source")
