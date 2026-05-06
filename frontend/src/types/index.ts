export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  full_name?: string
  role: 'student' | 'teacher' | 'admin'
  level: 'beginner' | 'intermediate' | 'advanced'
  language: 'uz' | 'ru' | 'en'
  avatar?: string | null
  bio?: string
  phone?: string
  is_superuser?: boolean
  date_joined?: string
}

export interface AdminUser extends User {
  is_active: boolean
  last_login?: string | null
}

export interface AdminStats {
  total_users: number
  total_students: number
  total_teachers: number
  active_users: number
  total_courses: number
  published_courses: number
  total_enrollments: number
  total_conversations: number
  flagged_conversations: number
}

export interface AdminConversation {
  id: number
  student_email: string
  student_name: string
  title: string
  is_flagged: boolean
  flag_reason: string
  message_count: number
  updated_at: string
}

export interface AdminCourse {
  id: number
  title: string
  teacher_name: string
  teacher_email: string
  level: string
  is_published: boolean
  enrollment_count: number
  created_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
  user: User
}

export interface Category {
  id: number
  name: string
  slug: string
}

export interface Course {
  id: number
  title: string
  description: string
  level: string
  language: string
  category: Category | null
  teacher_name: string
  is_enrolled?: boolean
  modules_count?: number
  lessons_count?: number
  created_at: string
}

export interface Lesson {
  id: number
  title: string
  content: string
  lesson_type: 'text' | 'video' | 'quiz'
  order: number
  video_url?: string
}

export interface Module {
  id: number
  title: string
  order: number
  lessons: Lesson[]
}

export interface CourseDetail extends Course {
  modules: Module[]
}

export interface QuizQuestion {
  id: number
  question: string
  topic_tag: string
  choices: { id: number; text: string }[]
}

export interface QuizResult {
  score: number
  passed: boolean
  answers: {
    question_text: string
    chosen_text: string
    is_correct: boolean
    correct_choice: string
  }[]
}

export interface Conversation {
  id: number
  title: string
  lesson: number | null
  created_at: string
  message_count: number
}

export interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface LessonProgress {
  lesson_id: number
  lesson_title: string
  completed: boolean
  completed_at: string | null
}

export interface CourseProgress {
  course_id: number
  course_title: string
  total_lessons: number
  completed_lessons: number
  percentage: number
}

export interface WeakArea {
  id: number
  topic_tag: string
  resolved: boolean
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
