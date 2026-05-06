import re
from django.core.cache import cache

# Patterns across Uzbek, Russian, English that signal a student wants AI to solve their assignment
_EXAM_PATTERNS = [
    # English
    r"\bdo\s+my\s+(homework|assignment|exam|quiz|test)\b",
    r"\bsolve\s+(this|my)\s+(exam|assignment|quiz|test|question)\b",
    r"\b(write|answer|complete)\s+(my|this)\s+(assignment|exam|homework|essay)\b",
    r"\bgive\s+me\s+(the\s+)?(answer|solution)\s+(to|for)\s+(my\s+)?(exam|assignment|homework|quiz)\b",
    r"\bthis\s+is\s+(my\s+)?(exam|assignment|homework|quiz)\b",
    # Uzbek
    r"\b(imtihon|topshiriq|uy\s*ishi|vazifa)\s*(savol|javob|yechim)\b",
    r"\bmenga\s*(topshiriq|imtihon|uy\s*ishi|vazifani?)\s*(yech|qil|yoz|bajari?)\b",
    r"\b(uy\s*vazifa|uy\s*ishi|topshiriq)ni?\s*(men\s+uchun\s+)?(yech|bajar|yoz)\b",
    r"\b(imtihon|test|quiz)\s*javob(ini|larini)?\b",
    r"\b(imtihon|topshiriq)\s+\w+\s+javob\b",
    r"\bbu\s+(mening\s+)?(topshiriq|imtihon|vazifa)im\b",
    # Russian
    r"\b(реши|напиши|сделай|выполни)\s+(моё?|мое|моя|мои)?\s*(задание|домашнее\s*задание|экзамен|контрольн\w+)\b",
    r"\bдай\s+(мне\s+)?(ответ|решение)\s+(на|к)\s+(моём?|моему)?\s*(заданию|экзамену|тесту)\b",
    r"\bэто\s+(моё?|мое)?\s*(задание|домашнее\s*задание|экзамен|контрольн\w+)\b",
    r"\b(ответь|реши)\s+за\s+меня\b",
]

_COMPILED = [re.compile(p, re.IGNORECASE | re.UNICODE) for p in _EXAM_PATTERNS]


def is_exam_request(text: str) -> bool:
    """Return True if the message looks like an assignment/exam bypass attempt."""
    return any(p.search(text) for p in _COMPILED)


# Rate limit: max 30 AI requests per user per 60 seconds
_RATE_LIMIT = 30
_RATE_WINDOW = 60  # seconds


def is_rate_limited(user_id: int) -> bool:
    """Return True if the user has exceeded the rate limit."""
    key = f"ratelimit:chat:{user_id}"
    count = cache.get(key, 0)
    if count >= _RATE_LIMIT:
        return True
    cache.set(key, count + 1, timeout=_RATE_WINDOW)
    return False
