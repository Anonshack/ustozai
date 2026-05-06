# Ustozai Frontend

React + TypeScript + Vite bilan qurilgan o'quv platformasi frontend qismi.

## Texnologiyalar

- React 18
- TypeScript
- Vite
- React Router v6
- TanStack Query (React Query)
- Zustand (state management)
- Axios
- Tailwind CSS
- Lucide React (icons)

## O'rnatish

```bash
cd frontend
npm install
```

`.env` faylini to'ldiring:

```
VITE_API_URL=http://localhost:8000/api/v1
```

## Ishga tushirish

```bash
npm run dev
```

Frontend `http://localhost:3000` da ishga tushadi.

## Build

```bash
npm run build
```

Build fayllari `dist/` papkasida bo'ladi.

## Loyiha strukturasi

```
src/
  components/       # Umumiy komponentlar (Layout, ProtectedRoute)
  lib/              # API client, utilities
  pages/            # Sahifalar
    auth/           # Login, Register, Profile
    courses/        # CourseList, CourseDetail
    lessons/        # LessonView (quiz bilan)
    chat/           # AI chat
    progress/       # Progress dashboard
    teacher/        # Teacher panel (CRUD)
  store/            # Zustand stores (authStore)
  types/            # TypeScript types
  App.tsx           # Router
  main.tsx          # Entry point
```

## Asosiy xususiyatlar

### O'quvchi uchun:
- Kurslar ro'yxati (search, filter)
- Kursga yozilish
- Dars o'qish
- Quiz yechish (70% dan yuqori o'tadi)
- AI mentor bilan suhbat
- Progress ko'rish
- Zaif tomonlar

### O'qituvchi uchun:
- Kurs yaratish/tahrirlash
- Modul qo'shish
- Dars yaratish
- Quiz savollari qo'shish

## API Integration

Backend: `http://localhost:8000/api/v1`

Barcha so'rovlar JWT token bilan autentifikatsiya qilinadi. Token avtomatik refresh qilinadi.

## Deployment

Production uchun `.env.production` faylini to'ldiring:

```
VITE_API_URL=https://yourdomain.com/api/v1
```

Build qiling:

```bash
npm run build
```

`dist/` papkasini Nginx, Vercel, Netlify yoki boshqa static hosting ga deploy qiling.

### Nginx misol

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/ustozai/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
