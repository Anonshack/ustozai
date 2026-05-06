from django.contrib import admin
from django.utils.html import format_html
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("role", "content", "input_tokens", "output_tokens", "created_at")
    can_delete = False
    max_num = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "student", "title", "course", "message_count",
        "flagged_display", "flag_reason", "created_at", "updated_at",
    )
    list_filter = ("is_flagged", "created_at")
    search_fields = ("student__email", "title", "flag_reason")
    readonly_fields = ("summary", "summary_message_count", "created_at", "updated_at")
    inlines = (MessageInline,)
    actions = ("mark_flagged", "mark_unflagged")

    @admin.display(description="Messages")
    def message_count(self, obj):
        return obj.messages.count()

    @admin.display(description="Flagged", boolean=True)
    def flagged_display(self, obj):
        return obj.is_flagged

    @admin.action(description="Flag selected conversations")
    def mark_flagged(self, request, queryset):
        queryset.update(is_flagged=True, flag_reason="Batch-flagged by admin.")

    @admin.action(description="Remove flag from selected conversations")
    def mark_unflagged(self, request, queryset):
        queryset.update(is_flagged=False, flag_reason="")
