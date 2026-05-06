"""
Quiz submission logic — isolated here to keep views thin.
"""
from django.utils import timezone
from django.db import transaction
from .models import QuizQuestion, QuizChoice, QuizAttempt, QuizAnswer, Lesson

PASS_THRESHOLD = 70  # percent


@transaction.atomic
def submit_quiz(student, lesson: Lesson, answers_data: list[dict]) -> QuizAttempt:
    """
    answers_data: [{"question_id": int, "choice_id": int}, ...]
    Returns a completed QuizAttempt.
    Also:
    - Creates WeakArea entries for wrong questions that have a topic_tag.
    - Marks lesson as complete via LessonProgress if passed.
    """
    attempt = QuizAttempt.objects.create(student=student, lesson=lesson)

    correct_count = 0
    wrong_topics: set[str] = set()

    for item in answers_data:
        try:
            question = QuizQuestion.objects.get(pk=item["question_id"], lesson=lesson)
            choice = QuizChoice.objects.get(pk=item["choice_id"], question=question)
        except (QuizQuestion.DoesNotExist, QuizChoice.DoesNotExist):
            continue

        is_correct = choice.is_correct
        QuizAnswer.objects.create(
            attempt=attempt,
            question=question,
            chosen_choice=choice,
            is_correct=is_correct,
        )

        if is_correct:
            correct_count += 1
        elif question.topic_tag:
            wrong_topics.add(question.topic_tag)

    total = attempt.answers.count()
    score = round((correct_count / total * 100), 1) if total else 0
    passed = score >= PASS_THRESHOLD

    attempt.score = score
    attempt.passed = passed
    attempt.completed_at = timezone.now()
    attempt.save(update_fields=["score", "passed", "completed_at"])

    # Register weak areas for every wrong topic
    if wrong_topics:
        from apps.progress.models import WeakArea
        for topic in wrong_topics:
            WeakArea.objects.get_or_create(
                student=student,
                topic=topic,
                defaults={"source": WeakArea.Source.QUIZ},
            )

    # Auto-complete lesson if passed
    if passed:
        _mark_lesson_complete(student, lesson)

    return attempt


def _mark_lesson_complete(student, lesson: Lesson) -> None:
    from apps.progress.models import LessonProgress, CourseProgress
    from .models import Lesson as L

    progress, _ = LessonProgress.objects.get_or_create(student=student, lesson=lesson)
    if not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = timezone.now()
        progress.save(update_fields=["is_completed", "completed_at"])

        course = lesson.module.course
        total = L.objects.filter(module__course=course).count()
        completed = LessonProgress.objects.filter(
            student=student, lesson__module__course=course, is_completed=True
        ).count()
        CourseProgress.objects.update_or_create(
            student=student,
            course=course,
            defaults={"total_lessons": total, "completed_lessons": completed},
        )
