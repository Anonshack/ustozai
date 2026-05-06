import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Course, Category, PaginatedResponse } from '../../types'
import { Search, BookOpen, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const LEVEL_LABELS: Record<string, string> = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' }
const LANG_LABELS: Record<string, string> = { uz: "O'zbek", ru: 'Rus', en: 'Ingliz' }

export default function CourseList() {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')
  const [language, setLanguage] = useState('')

  const { data, isLoading } = useQuery<PaginatedResponse<Course>>({
    queryKey: ['courses', search, level, language],
    queryFn: () =>
      api.get('/courses/', { params: { search: search || undefined, level: level || undefined, language: language || undefined } }).then((r) => r.data),
  })

  const { data: _categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/courses/categories/').then((r) => r.data),
  })

  const enroll = async (courseId: number) => {
    try {
      await api.post(`/courses/${courseId}/enroll/`)
      toast.success('Kursga yozildingiz!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xato yuz berdi')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kurslar</h1>
        <span className="text-gray-500 text-sm">{data?.count || 0} ta kurs</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Kurs qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">Barcha darajalar</option>
          {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="input w-auto" value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">Barcha tillar</option>
          {Object.entries(LANG_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-3 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.results.map((course) => (
            <div key={course.id} className="card hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg leading-tight mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-500">{course.teacher_name}</p>
                </div>
                <BookOpen className="text-blue-500 ml-2 flex-shrink-0" size={20} />
              </div>
              <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-2">{course.description}</p>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="badge bg-blue-100 text-blue-700">{LEVEL_LABELS[course.level] || course.level}</span>
                <span className="badge bg-green-100 text-green-700">{LANG_LABELS[course.language] || course.language}</span>
                {course.category && <span className="badge bg-gray-100 text-gray-600">{course.category.name}</span>}
              </div>
              <div className="flex gap-2">
                <Link to={`/courses/${course.id}`} className="btn-secondary flex-1 text-center text-sm">
                  Ko'rish
                </Link>
                {!course.is_enrolled && (
                  <button onClick={() => enroll(course.id)} className="btn-primary flex-1 text-sm">
                    Yozilish
                  </button>
                )}
                {course.is_enrolled && (
                  <span className="flex-1 text-center text-sm text-green-600 font-medium py-2">✓ Yozilgan</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.results.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Filter size={48} className="mx-auto mb-3 opacity-30" />
          <p>Kurs topilmadi</p>
        </div>
      )}
    </div>
  )
}
