import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import type { CourseProgress } from '../types'
import { BookOpen, MessageCircle, TrendingUp, ArrowRight } from 'lucide-react'

export default function Home() {
  const { user } = useAuthStore()

  const { data: progress } = useQuery<CourseProgress[]>({
    queryKey: ['my-progress'],
    queryFn: () => api.get('/progress/my-progress/').then((r) => Array.isArray(r.data) ? r.data : r.data.results ?? []),
  })

  const inProgress = progress?.filter((c) => c.percentage > 0 && c.percentage < 100) || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Xush kelibsiz, {user?.first_name}! 👋
        </h1>
        <p className="text-gray-600">Bugun nima o'rganamiz?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/courses" className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <BookOpen className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="font-semibold">Kurslar</p>
            <p className="text-sm text-gray-500">Yangi kurs boshlash</p>
          </div>
          <ArrowRight className="ml-auto text-gray-400 group-hover:text-blue-600 transition-colors" size={18} />
        </Link>

        <Link to="/chat" className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <MessageCircle className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="font-semibold">AI Mentor</p>
            <p className="text-sm text-gray-500">Savol berish</p>
          </div>
          <ArrowRight className="ml-auto text-gray-400 group-hover:text-purple-600 transition-colors" size={18} />
        </Link>

        <Link to="/progress" className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <div>
            <p className="font-semibold">Progress</p>
            <p className="text-sm text-gray-500">Natijalarni ko'rish</p>
          </div>
          <ArrowRight className="ml-auto text-gray-400 group-hover:text-green-600 transition-colors" size={18} />
        </Link>
      </div>

      {/* In progress courses */}
      {inProgress.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Davom etayotgan kurslar</h2>
          <div className="space-y-4">
            {inProgress.map((course) => (
              <div key={course.course_id}>
                <div className="flex items-center justify-between mb-2">
                  <Link to={`/courses/${course.course_id}`} className="font-medium hover:text-blue-600 transition-colors">
                    {course.course_title}
                  </Link>
                  <span className="text-sm text-gray-500">{course.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${course.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
