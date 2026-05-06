import anthropic
from django.conf import settings
from .models import Conversation, Message

SYSTEM_PROMPT = """# ROLE

You are **CodeMentor AI** — a senior IT instructor and personal mentor for students of an IT Learning Center.
You combine the depth of a 10+ year software engineer with the patience and clarity of a top-tier teacher.
Your purpose: help students learn programming, computer science, and modern IT skills as quickly and deeply as possible — without ever doing their thinking for them.

---

# CORE PRINCIPLES

1. **Teach, don't just answer.** Every response should leave the student more capable, not more dependent.
2. **Show the path, then walk it together.** First explain the concept, then demonstrate, then guide the student to do it themselves.
3. **Meet the student where they are.** Detect skill level from their questions and code, then calibrate vocabulary, depth, and pace.
4. **Be brutally honest about code.** Praise what works. Point out bugs, anti-patterns, and security issues directly. No empty validation.
5. **Production-mindset always.** Every example should reflect how real engineers write code in 2025+ — clean, tested, secure, idiomatic.
6. **Multilingual by default.** Respond in the language the student writes in (Uzbek, Russian, or English). Mirror their language exactly. Code, error messages, and technical terms stay in English.

---

# DOMAIN COVERAGE

You are an expert in:

- **Languages:** Python, JavaScript/TypeScript, Go, Rust, Java, Kotlin, Swift, C/C++, C#, SQL, Bash
- **Frontend:** React, Next.js, Vue, Svelte, HTML/CSS, Tailwind, modern build tools (Vite, Turbopack)
- **Backend:** Node.js, FastAPI, Django, Spring Boot, .NET, Express, NestJS, REST, GraphQL, gRPC
- **Mobile:** React Native, Flutter, native iOS (Swift/SwiftUI), native Android (Kotlin/Jetpack Compose)
- **Databases:** PostgreSQL, MySQL, MongoDB, Redis, SQLite, vector DBs (pgvector, Pinecone, Weaviate)
- **DevOps & Cloud:** Docker, Kubernetes, GitHub Actions, CI/CD, AWS, GCP, Azure, Terraform, Linux
- **AI/ML:** Python ML stack (NumPy, Pandas, scikit-learn, PyTorch), LLM APIs, RAG, fine-tuning, prompt engineering
- **CS Fundamentals:** Algorithms, data structures, complexity analysis, design patterns, system design, OOP, FP
- **Security:** OWASP Top 10, auth (OAuth2/JWT), encryption basics, secure coding
- **Tools:** Git, VS Code, terminal, debugging, testing (unit, integration, E2E)

---

# RESPONSE STYLE

**Default structure for technical questions:**
1. **TL;DR** — one or two sentences answering the question directly.
2. **Concept** — explain the *why* with an analogy or mental model when useful.
3. **Code example** — minimal, runnable, commented.
4. **Try it yourself** — a small task or variation for the student to attempt.
5. **Going deeper** — optional links, related topics, or next steps.

**Formatting rules:**
- Use fenced code blocks with language tags.
- Keep prose tight. No filler phrases.
- Use tables for comparisons.

---

# HARD RULES

- **Never write code for graded assignments or exam questions** when the student is bypassing learning.
- **Never fabricate API behavior, library functions, or syntax.**
- **Never produce malicious code.**
- **Stay on mission.** Redirect off-topic questions politely.
"""

# How many fresh messages to always keep in context
_FRESH_MESSAGE_COUNT = 10
# Trigger re-summarization every time this many new messages arrive since last summary
_SUMMARIZE_EVERY = 10


def _build_student_context(user) -> str:
    from apps.progress.models import CourseProgress, WeakArea
    from apps.courses.models import Module

    # Active courses with progress percentages
    course_progresses = list(
        CourseProgress.objects
        .filter(student=user)
        .select_related("course")
        .order_by("-last_accessed_at")[:5]
    )

    # Completed modules: modules where student finished at least one lesson
    completed_module_names = list(
        Module.objects
        .filter(
            lessons__progress_records__student=user,
            lessons__progress_records__is_completed=True,
        )
        .distinct()
        .values_list("title", flat=True)[:10]
    )

    # Unresolved weak areas
    weak_topics = list(
        WeakArea.objects
        .filter(student=user, resolved=False)
        .values_list("topic", flat=True)[:10]
    )

    lines = ["\n---\n# STUDENT PROFILE"]
    lines.append(f"- Name: {user.full_name}")
    lines.append(f"- Level: {user.get_level_display()}")
    lines.append(f"- Preferred language: {user.language}")

    if course_progresses:
        lines.append("- Active courses:")
        for cp in course_progresses:
            lines.append(
                f"  • {cp.course.title}: {cp.percentage}%"
                f" ({cp.completed_lessons}/{cp.total_lessons} lessons done)"
            )
    else:
        lines.append("- Active courses: none yet")

    if completed_module_names:
        lines.append(f"- Completed modules: {', '.join(completed_module_names)}")
    else:
        lines.append("- Completed modules: none yet")

    if weak_topics:
        lines.append(f"- Weak areas (needs reinforcement): {', '.join(weak_topics)}")
        lines.append("  → When these topics come up, slow down and reinforce the fundamentals.")
    else:
        lines.append("- Weak areas: none identified yet")

    lines.append("\nCalibrate explanations to this student's level and respond in their language.\n")
    return "\n".join(lines)


def _build_rag_context(conversation: Conversation) -> str:
    """Inject relevant lesson/course content (RAG) into the system prompt."""
    parts = []

    if conversation.lesson and conversation.lesson.content:
        lesson = conversation.lesson
        parts.append(
            f"\n---\n# CURRENT LESSON CONTEXT (RAG)\n"
            f"The student is studying: **{lesson.title}** (type: {lesson.lesson_type})\n\n"
            f"{lesson.content[:2000]}\n"
            f"\nAnchor your explanations to this lesson's content when relevant.\n"
        )
    elif conversation.course:
        course = conversation.course
        parts.append(
            f"\n---\n# CURRENT COURSE CONTEXT (RAG)\n"
            f"The student is enrolled in: **{course.title}** (level: {course.level})\n"
            f"{course.description[:500]}\n"
        )

    return "".join(parts)


def _refresh_summary_if_needed(conversation: Conversation, client: anthropic.Anthropic) -> None:
    """
    Summarize messages older than the last fresh batch if enough new messages have arrived.
    Stores the summary back on the conversation so the next call can use it.
    """
    total = conversation.messages.count()
    # Re-summarize when we have _SUMMARIZE_EVERY new messages since last summary
    if total - conversation.summary_message_count < _SUMMARIZE_EVERY + _FRESH_MESSAGE_COUNT:
        return

    # Messages to summarize: everything except the freshest _FRESH_MESSAGE_COUNT
    older_messages = list(
        conversation.messages.order_by("created_at")[: total - _FRESH_MESSAGE_COUNT]
    )
    if not older_messages:
        return

    history_text = "\n".join(
        f"{m.role.upper()}: {m.content}" for m in older_messages
    )
    existing = f"\nPrevious summary:\n{conversation.summary}\n\n" if conversation.summary else ""

    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=400,
        temperature=0.3,
        system="You are a concise summarizer. Summarize the key points, mistakes, and progress from this tutoring conversation in 3-5 bullet points. Be brief.",
        messages=[
            {
                "role": "user",
                "content": f"{existing}Conversation to summarize:\n{history_text}",
            }
        ],
    )

    conversation.summary = response.content[0].text
    conversation.summary_message_count = total - _FRESH_MESSAGE_COUNT
    conversation.save(update_fields=["summary", "summary_message_count"])


def get_ai_response(conversation: Conversation, user_message: str) -> tuple[str, int, int]:
    """
    Returns (reply_text, input_tokens, output_tokens).
    Uses: temperature 0.5, prompt caching, RAG, rolling summary.
    """
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    # Refresh rolling summary if enough new messages have accumulated
    _refresh_summary_if_needed(conversation, client)

    # Build full system prompt: base + student profile + RAG
    full_system = (
        SYSTEM_PROMPT
        + _build_student_context(conversation.student)
        + _build_rag_context(conversation)
    )

    # Build message list: summary block (if exists) + last N fresh messages
    fresh_messages = list(
        conversation.messages.order_by("-created_at")[:_FRESH_MESSAGE_COUNT]
    )
    history = [{"role": m.role, "content": m.content} for m in reversed(fresh_messages)]

    if conversation.summary:
        # Prepend summary as the first user/assistant exchange so the model treats it as prior context
        history = [
            {"role": "user", "content": "[Earlier conversation summary]"},
            {"role": "assistant", "content": conversation.summary},
        ] + history

    history.append({"role": "user", "content": user_message})

    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=settings.ANTHROPIC_MAX_TOKENS,
        temperature=0.5,
        system=[
            {
                "type": "text",
                "text": full_system,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=history,
    )

    reply = response.content[0].text
    return reply, response.usage.input_tokens, response.usage.output_tokens
