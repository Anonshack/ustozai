from django.contrib import admin
from .models import Category, Course, Module, Lesson, Enrollment, QuizQuestion, QuizChoice, QuizAttempt


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "teacher", "level", "language", "is_published", "created_at")
    list_filter = ("level", "language", "is_published", "category")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = (ModuleInline,)


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order")
    inlines = (LessonInline,)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "enrolled_at", "is_completed")
    list_filter = ("is_completed",)


class QuizChoiceInline(admin.TabularInline):
    model = QuizChoice
    extra = 2
    fields = ("text", "is_correct")


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ("lesson", "question_short", "topic_tag", "order")
    list_filter = ("lesson__module__course",)
    search_fields = ("question", "topic_tag")
    inlines = (QuizChoiceInline,)

    @admin.display(description="Question")
    def question_short(self, obj):
        return obj.question[:80]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ("student", "lesson", "score", "passed", "started_at")
    list_filter = ("passed",)
    search_fields = ("student__email",)
    readonly_fields = ("score", "passed", "started_at", "completed_at")
