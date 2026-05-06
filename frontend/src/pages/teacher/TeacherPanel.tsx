import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Course, PaginatedResponse } from '../../types'
import { Plus, Edit, Trash2, BookOpen, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import CourseForm from './CourseForm'

export default function TeacherPanel() {
  const [showForm, setShowForm] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<PaginatedResponse<Course>>({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/courses/').then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/courses/${id}/`),
    onSuccess: () => {
      toast.success('Kurs o\'chirildi')
      qc.invalidateQueries({ queryKey: ['my-courses'] })
    },
    onError: () => toast.error('O\'chirib bo\'lmadi'),
  })

  const handleEdit = (course: Course) => {
    setEditCourse(course)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditCourse(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">O'qituvchi paneli</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Yangi kurs
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CourseForm
              course={editCourse}
              onClose={handleClose}
              onSuccess={() => {
                qc.invalidateQueries({ queryKey: ['my-courses'] })
                handleClose()
              }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.results.map((course) => (
            <div key={course.id} className="card flex items-center gap-4">
              <BookOpen className="text-blue-500 flex-shrink-0" size={24} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{course.title}</h3>
                <p className="text-sm text-gray-500">{course.level} · {course.language}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/teacher/courses/${course.id}/modules`}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  Modullar <ChevronRight size={14} />
                </Link>
                <button onClick={() => handleEdit(course)} className="btn-secondary p-2">
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Kursni o\'chirishni tasdiqlaysizmi?')) deleteMutation.mutate(course.id)
                  }}
                  className="btn-danger p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {data?.results.length === 0 && (
            <div className="card text-center py-12 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
              <p>Hali kurs yaratmagansiz</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
