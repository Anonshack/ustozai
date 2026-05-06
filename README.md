# Ustozai — IT Learning Center Backend

Django REST API. Claude AI orqali ishlaydigan o'quv platformasining backend qismi. O'quvchilar kurslarni o'rganadi, quizlar yechadi va AI mentor bilan suhbatlashadi.

---

## Texnologiyalar

- Python 3.12
- Django 6.0
- Django REST Framework
- Claude Sonnet 4.6 (Anthropic)
- SQLite (development) / PostgreSQL (production)
- JWT autentifikatsiya

---

## O'rnatish

```bash
git clone https://github.com/Anonshack/ustozai
cd ustozai

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

`.env` faylini to'ldiring:

```
SECRET_KEY=o'zingizning-kalit-so'zingiz
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6
ANTHROPIC_MAX_TOKENS=3000
```

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Admin panel: `http://127.0.0.1:8000/admin/`

---

## API endpointlar

### Autentifikatsiya

```
POST   /api/v1/auth/register/        # ro'yxatdan o'tish
POST   /api/v1/auth/login/           # kirish, access + refresh token qaytaradi
POST   /api/v1/auth/logout/          # refresh tokenni o'chiradi
POST   /api/v1/auth/token/refresh/   # access tokenni yangilash
GET    /api/v1/auth/me/              # o'z profilini ko'rish
PATCH  /api/v1/auth/me/              # profilni tahrirlash
```

Login javobi shunday ko'rinadi:

```json
{
  "access": "...",
  "refresh": "...",
  "user": {
    "id": 1,
    "email": "ali@example.com",
    "role": "student",
    "level": "beginner",
    "language": "uz"
  }
}
```

Keyingi barcha so'rovlarda header qo'shing:

```
Authorization: Bearer <access_token>
```

---

### Kurslar

```
GET    /api/v1/courses/                          # kurslar ro'yxati
GET    /api/v1/courses/{id}/                     # kurs detali (modullar bilan)
POST   /api/v1/courses/                          # kurs yaratish (teacher)
PATCH  /api/v1/courses/{id}/                     # kursni tahrirlash (teacher)
DELETE /api/v1/courses/{id}/                     # o'chirish (teacher)
POST   /api/v1/courses/{id}/enroll/              # kursga yozilish
GET    /api/v1/courses/my-enrollments/           # o'zim yozilgan kurslar
GET    /api/v1/courses/categories/               # kategoriyalar
```

Filterlash:

```
GET /api/v1/courses/?level=beginner&language=uz
GET /api/v1/courses/?search=python
GET /api/v1/courses/?ordering=-created_at
```

---

### Modullar va darslar

```
GET    /api/v1/courses/{course_id}/modules/
POST   /api/v1/courses/{course_id}/modules/
GET    /api/v1/courses/{course_id}/modules/{module_id}/lessons/
POST   /api/v1/courses/{course_id}/modules/{module_id}/lessons/
```

---

### Quiz

```
GET    /api/v1/courses/lessons/{id}/quiz/             # savollar (to'g'ri javob ko'rinmaydi)
POST   /api/v1/courses/lessons/{id}/quiz/manage/      # savol qo'shish (teacher)
POST   /api/v1/courses/lessons/{id}/quiz/submit/      # javoblarni yuborish
GET    /api/v1/courses/lessons/{id}/quiz/my-attempts/ # o'z urinishlarim
```

Submit so'rovi:

```json
{
  "answers": [
    {"question_id": 1, "choice_id": 3},
    {"question_id": 2, "choice_id": 7}
  ]
}
```

Javob:

```json
{
  "score": 50.0,
  "passed": false,
  "answers": [
    {
      "question_text": "Recursion base case nima?",
      "chosen_text": "Loop",
      "is_correct": false,
      "correct_choice": "Funksiya o'zini to'xtatadigan shart"
    }
  ]
}
```

70% va undan yuqori ball olsangiz dars tugallanadi. Noto'g'ri javob berilgan savollarning `topic_tag`i zaif tomonlar sifatida saqlanadi.

---

### AI suhbat

```
POST   /api/v1/chat/conversations/                      # yangi suhbat ochish
GET    /api/v1/chat/conversations/                      # barcha suhbatlarim
GET    /api/v1/chat/conversations/{id}/                 # suhbat detali
POST   /api/v1/chat/conversations/{id}/send/            # xabar yuborish
GET    /api/v1/chat/conversations/{id}/messages/        # xabarlar tarixi
POST   /api/v1/chat/conversations/{id}/flag/            # suhbatni belgilash (admin)
POST   /api/v1/chat/conversations/{id}/unflag/          # belgini olib tashlash (admin)
```

Suhbat ochishda kurs yoki darsni bog'lash mumkin — AI o'sha darsning mazmunini biladi:

```json
{
  "title": "Recursion haqida savol",
  "lesson": 12
}
```

Xabar yuborish:

```json
{
  "message": "Rekursiya nima va qachon ishlatiladi?"
}
```

AI har suhbatda o'quvchining darajasini, tilini, qaysi darslarni tugatganini va zaif tomonlarini hisobga oladi. Imtihon yoki topshiriq yechimi so'ralsa, javob bermaydi va suhbat flag qilinadi.

---

### Progress

```
POST   /api/v1/progress/complete-lesson/        # darsni tugallash
GET    /api/v1/progress/my-progress/            # kurslar bo'yicha progress
GET    /api/v1/progress/course/{id}/            # bitta kurs bo'yicha darslar holati
GET    /api/v1/progress/weak-areas/             # zaif tomonlarim
POST   /api/v1/progress/weak-areas/create/      # zaif tomonni qo'shish (teacher)
POST   /api/v1/progress/weak-areas/{id}/resolve/ # yechildi deb belgilash
```

---

## Foydalanuvchi rollari

**student** — kursga yozilish, dars ko'rish, quiz yechish, AI bilan suhbat.

**teacher** — kurs va dars yaratish, quiz savollari qo'shish, o'quvchilarga zaif tomonlarni belgilash.

**admin** — hammasi + suhbatlarni kuzatish, flaglash.

---

## AI qanday ishlaydi

Har bir suhbatda Claude ga quyidagilar yuboriladi:

1. Asosiy sistema so'rovi (CodeMentor AI roli, qoidalar, pedagogika)
2. O'quvchi profili — ismi, darajasi, tili, qaysi kurslar qanchata tugallangani, zaif tomonlar
3. Dars matni (agar suhbat biror darsga bog'liq bo'lsa)
4. Suhbat tarixi — so'nggi 10 xabar

Suhbat 20 xabardan oshganda eski qismi avtomatik qisqartiriladi va keyingi so'rovlarga xulosa sifatida qo'shiladi. Bu token tejaydi.

---

## Production uchun

`.env` ga qo'shing:

```
DJANGO_SETTINGS_MODULE=config.settings.production
DB_NAME=ustozai
DB_USER=postgres
DB_PASSWORD=...
DB_HOST=localhost
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

```bash
python manage.py collectstatic
gunicorn config.wsgi:application
```

---

## Loyiha tuzilmasi

```
apps/
  users/      — autentifikatsiya, profil
  courses/    — kurslar, modullar, darslar, quiz
  chat/       — AI suhbat, xabarlar, guardrails
  progress/   — dars va kurs progressi, zaif tomonlar
config/
  settings/
    base.py
    development.py
    production.py
```
