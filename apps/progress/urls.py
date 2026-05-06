from django.urls import path
from .views import (
    MarkLessonCompleteView, MyCourseProgressView, CourseLessonProgressView,
    MyWeakAreasView, WeakAreaCreateView, WeakAreaResolveView,
)

urlpatterns = [
    path("complete-lesson/", MarkLessonCompleteView.as_view(), name="complete-lesson"),
    path("my-progress/", MyCourseProgressView.as_view(), name="my-progress"),
    path("course/<int:course_id>/", CourseLessonProgressView.as_view(), name="course-lesson-progress"),
    # Weak areas
    path("weak-areas/", MyWeakAreasView.as_view(), name="weak-areas"),
    path("weak-areas/create/", WeakAreaCreateView.as_view(), name="weak-areas-create"),
    path("weak-areas/<int:pk>/resolve/", WeakAreaResolveView.as_view(), name="weak-areas-resolve"),
]
