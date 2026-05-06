from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, MeView,
    AdminUserListView, AdminUserDetailView, AdminAssignRoleView,
    AdminToggleActiveView, AdminStatsView, AdminFlaggedConversationsView,
    AdminConversationListView, AdminDeleteConversationView,
    AdminCourseListView, AdminToggleCoursePublishView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    # Admin endpoints
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("admin/users/<int:pk>/assign-role/", AdminAssignRoleView.as_view(), name="admin-assign-role"),
    path("admin/users/<int:pk>/toggle-active/", AdminToggleActiveView.as_view(), name="admin-toggle-active"),
    path("admin/conversations/", AdminConversationListView.as_view(), name="admin-conversations"),
    path("admin/conversations/<int:pk>/delete/", AdminDeleteConversationView.as_view(), name="admin-delete-conversation"),
    path("admin/conversations/flagged/", AdminFlaggedConversationsView.as_view(), name="admin-flagged"),
    path("admin/courses/", AdminCourseListView.as_view(), name="admin-courses"),
    path("admin/courses/<int:pk>/toggle-publish/", AdminToggleCoursePublishView.as_view(), name="admin-toggle-publish"),
]
