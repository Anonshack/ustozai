from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers
from .views import (
    CategoryViewSet, CourseViewSet, ModuleViewSet, LessonViewSet, MyEnrollmentsView,
    QuizView, QuizManageView, QuizSubmitView, MyQuizAttemptsView,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("", CourseViewSet, basename="course")

courses_router = nested_routers.NestedDefaultRouter(router, "", lookup="course")
courses_router.register("modules", ModuleViewSet, basename="course-module")

modules_router = nested_routers.NestedDefaultRouter(courses_router, "modules", lookup="module")
modules_router.register("lessons", LessonViewSet, basename="module-lesson")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(courses_router.urls)),
    path("", include(modules_router.urls)),
    path("my-enrollments/", MyEnrollmentsView.as_view(), name="my-enrollments"),
    # Quiz endpoints — flat by lesson id for simplicity
    path("lessons/<int:lesson_id>/quiz/", QuizView.as_view(), name="quiz-detail"),
    path("lessons/<int:lesson_id>/quiz/manage/", QuizManageView.as_view(), name="quiz-manage"),
    path("lessons/<int:lesson_id>/quiz/submit/", QuizSubmitView.as_view(), name="quiz-submit"),
    path("lessons/<int:lesson_id>/quiz/my-attempts/", MyQuizAttemptsView.as_view(), name="quiz-my-attempts"),
]
