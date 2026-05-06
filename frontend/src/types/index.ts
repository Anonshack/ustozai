export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'student' | 'teacher' | 'admin'
  level: 'beginner' | 'intermediate' | 'advanced'
  language: 'uz' | 'ru' | 'en'
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
  teacher: { id: number; email: string; first_name: string; last_name: string }
  is_enrolled?: boolean
  modules_count?: number
  lessons_count?: number
  created_at: string
}

export interface Lesson {
  id: number
  title: string
  content: string
  order: number
  has_quiz: boolean
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
  text: string
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
