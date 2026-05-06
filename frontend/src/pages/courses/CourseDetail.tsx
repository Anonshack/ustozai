import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/api'
import type { CourseDetail } from '../../types'
import { BookOpen, ChevronRight, CheckCircle, Lock, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const LEVEL_LABELS: Record<string, string> = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' }

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: course, isLoading } = useQuery<CourseDetail>({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}/`).then((r) => r.data),
  })

  const enrollMutation = useMutation({
    mutationFn: () => api.post(`/courses/${id}/enroll/`),
    onSuccess: () => {
      toast.success('Kursga yozildingiz!')
      qc.invalidateQueries({ queryKey: ['course', id] })
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Xato'),
  })

  if (isLoading) return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  )

  if (!course) return <div className="text-center py-16 text-gray-500">Kurs topilmadi</div>

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="badge bg-blue-100 text-blue-700">{LEVEL_LABELS[course.level] || course.level}</span>
              <span className="badge bg-green-100 text-green-700">{course.language.toUpperCase()}</span>
              {course.category && <span className="badge bg-gray-100 text-gray-600">{course.category.name}</span>}
            </div>
            <p className="text-sm text-gray-500">
              O'qituvchi: <strong>{course.teacher.first_name} {course.teacher.last_name}</strong>
            </p>
          </div>
          <div className="flex flex-col gap-2 min-w-32">
            {!course.is_enrolled ? (
              <button
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
                className="btn-primary"
              >
                {enrollMutation.isPending ? 'Yozilmoqda...' : 'Kursga yozilish'}
              </button>
            ) : (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle size={16} /> Yozilgan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Kurs tarkibi</h2>
        {course.modules?.length === 0 && (
          <div className="card text-center text-gray-500 py-8">Hali modul qo'shilmagan</div>
        )}
        {course.modules?.map((module) => (
          <div key={module.id} className="card">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-500" />
              {module.title}
            </h3>
            <div className="space-y-2">
              {module.lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    {course.is_enrolled ? (
                      <ChevronRight size={16} className="text-blue-500" />
                    ) : (
                      <Lock size={16} className="text-gray-400" />
                    )}
                    <span className="text-sm font-medium">{lesson.title}</span>
                    {lesson.has_quiz && (
                      <span className="badge bg-purple-100 text-purple-700">Quiz</span>
                    )}
                  </div>
                  {course.is_enrolled && (
                    <div className="flex gap-2">
                      <Link
                        to={`/lessons/${lesson.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        O'rganish
                      </Link>
                      <Link
                        to={`/chat/new?lesson=${lesson.id}`}
                        className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <MessageCircle size={14} /> AI
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
