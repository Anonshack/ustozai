from django.contrib import admin
from .models import LessonProgress, CourseProgress, WeakArea


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("student", "lesson", "is_completed", "completed_at", "time_spent_seconds")
    list_filter = ("is_completed",)
    search_fields = ("student__email",)


@admin.register(CourseProgress)
class CourseProgressAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "completed_lessons", "total_lessons", "last_accessed_at")
    search_fields = ("student__email", "course__title")


@admin.register(WeakArea)
class WeakAreaAdmin(admin.ModelAdmin):
    list_display = ("student", "topic", "source", "resolved", "created_at")
    list_filter = ("resolved", "source")
    search_fields = ("student__email", "topic")
    actions = ("mark_resolved",)

    @admin.action(description="Mark selected weak areas as resolved")
    def mark_resolved(self, request, queryset):
        queryset.update(resolved=True)
