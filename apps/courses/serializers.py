from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    Category, Course, Module, Lesson, Enrollment,
    QuizQuestion, QuizChoice, QuizAttempt, QuizAnswer,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "icon")


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = (
            "id", "title", "lesson_type", "content", "video_url",
            "duration_minutes", "order", "is_free_preview",
        )


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ("id", "title", "order", "lessons")


class CourseListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    enrollment_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id", "title", "slug", "description", "category", "teacher_name",
            "thumbnail", "level", "language", "price", "enrollment_count", "is_enrolled", "created_at",
        )

    @extend_schema_field(serializers.IntegerField())
    def get_enrollment_count(self, obj) -> int:
        return obj.enrollments.count()

    @extend_schema_field(serializers.BooleanField())
    def get_is_enrolled(self, obj) -> bool:
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False


class CourseDetailSerializer(CourseListSerializer):
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ("modules",)


class CourseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = (
            "title", "slug", "description", "category", "thumbnail",
            "level", "language", "is_published", "price",
        )


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.filter(is_published=True),
        source="course",
        write_only=True,
    )

    class Meta:
        model = Enrollment
        fields = ("id", "course", "course_id", "enrolled_at", "is_completed", "completed_at")
        read_only_fields = ("enrolled_at", "is_completed", "completed_at")


# ── Quiz serializers ───────────────────────────────────────────────────────────

class QuizChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizChoice
        fields = ("id", "text")


class QuizChoiceAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizChoice
        fields = ("id", "text", "is_correct")


class QuizQuestionSerializer(serializers.ModelSerializer):
    choices = QuizChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ("id", "question", "order", "choices")


class QuizQuestionWriteSerializer(serializers.ModelSerializer):
    choices = QuizChoiceAdminSerializer(many=True)

    class Meta:
        model = QuizQuestion
        fields = ("id", "question", "topic_tag", "order", "choices")

    def create(self, validated_data):
        choices_data = validated_data.pop("choices")
        question = QuizQuestion.objects.create(**validated_data)
        for choice_data in choices_data:
            QuizChoice.objects.create(question=question, **choice_data)
        return question


class QuizAnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField()


class QuizSubmitSerializer(serializers.Serializer):
    answers = QuizAnswerInputSerializer(many=True, min_length=1)


class QuizAnswerResultSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.question", read_only=True)
    chosen_text = serializers.CharField(source="chosen_choice.text", read_only=True)
    correct_choice = serializers.SerializerMethodField()

    class Meta:
        model = QuizAnswer
        fields = ("question_text", "chosen_text", "is_correct", "correct_choice")

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_correct_choice(self, obj) -> str | None:
        correct = obj.question.choices.filter(is_correct=True).first()
        return correct.text if correct else None


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    answers = QuizAnswerResultSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ("id", "score", "passed", "started_at", "completed_at", "answers")
