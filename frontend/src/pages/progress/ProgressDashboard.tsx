import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { CourseProgress, WeakArea } from '../../types'
import { TrendingUp, AlertCircle, BookOpen, CheckCircle } from 'lucide-react'

export default function ProgressDashboard() {
  const { data: progress } = useQuery<CourseProgress[]>({
    queryKey: ['my-progress'],
    queryFn: () => api.get('/progress/my-progress/').then((r) => Array.isArray(r.data) ? r.data : r.data.results ?? []),
  })

  const { data: weakAreas } = useQuery<WeakArea[]>({
    queryKey: ['weak-areas'],
    queryFn: () => api.get('/progress/weak-areas/').then((r) => Array.isArray(r.data) ? r.data : r.data.results ?? []),
  })

  const totalLessons = progress?.reduce((sum, c) => sum + c.total_lessons, 0) || 0
  const completedLessons = progress?.reduce((sum, c) => sum + c.completed_lessons, 0) || 0
  const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mening progressim</h1>

      {/* Overall stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Jami kurslar</p>
              <p className="text-2xl font-bold">{progress?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tugallangan darslar</p>
              <p className="text-2xl font-bold">{completedLessons} / {totalLessons}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Umumiy progress</p>
              <p className="text-2xl font-bold">{overallPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course progress */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Kurslar bo'yicha progress</h2>
        {progress?.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Hali kursga yozilmagansiz</p>
        ) : (
          <div className="space-y-4">
            {progress?.map((course) => (
              <div key={course.course_id}>
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to={`/courses/${course.course_id}`}
                    className="font-medium hover:text-blue-600 transition-colors"
                  >
                    {course.course_title}
                  </Link>
                  <span className="text-sm text-gray-500">
                    {course.completed_lessons} / {course.total_lessons} dars
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${course.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{course.percentage}%</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weak areas */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="text-orange-500" size={20} />
          Zaif tomonlar
        </h2>
        {weakAreas?.filter((w) => !w.resolved).length === 0 ? (
          <p className="text-center text-gray-500 py-8">Zaif tomonlar yo'q! 🎉</p>
        ) : (
          <div className="space-y-2">
            {weakAreas
              ?.filter((w) => !w.resolved)
              .map((weak) => (
                <div
                  key={weak.id}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <span className="text-sm font-medium text-orange-800">{weak.topic_tag}</span>
                  <span className="text-xs text-orange-600">
                    {new Date(weak.created_at).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              ))}
          </div>
        )}
        {(weakAreas?.filter((w) => w.resolved).length ?? 0) > 0 && (
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer">Hal qilingan ({weakAreas?.filter((w) => w.resolved).length})</summary>
            <div className="space-y-2 mt-2">
              {weakAreas
                ?.filter((w) => w.resolved)
                .map((weak) => (
                  <div key={weak.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm font-medium text-green-800 line-through">{weak.topic_tag}</span>
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
