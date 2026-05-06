from django.db import models
from django.conf import settings


class LessonProgress(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey(
        "courses.Lesson", on_delete=models.CASCADE, related_name="progress_records"
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "lesson_progress"
        unique_together = ("student", "lesson")

    def __str__(self):
        return f"{self.student} — {self.lesson} ({'done' if self.is_completed else 'in progress'})"


class CourseProgress(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="course_progress"
    )
    course = models.ForeignKey(
        "courses.Course", on_delete=models.CASCADE, related_name="progress_records"
    )
    total_lessons = models.PositiveIntegerField(default=0)
    completed_lessons = models.PositiveIntegerField(default=0)
    last_accessed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "course_progress"
        unique_together = ("student", "course")

    @property
    def percentage(self):
        if self.total_lessons == 0:
            return 0
        return round((self.completed_lessons / self.total_lessons) * 100, 1)

    def __str__(self):
        return f"{self.student} — {self.course} ({self.percentage}%)"


class WeakArea(models.Model):
    class Source(models.TextChoices):
        QUIZ = "quiz", "Quiz result"
        MANUAL = "manual", "Teacher / admin"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="weak_areas"
    )
    topic = models.CharField(max_length=100)   # e.g. "recursion", "async/await", "OOP"
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.QUIZ)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "weak_areas"
        unique_together = ("student", "topic")

    def __str__(self):
        status = "resolved" if self.resolved else "active"
        return f"{self.student} — {self.topic} [{status}]"
