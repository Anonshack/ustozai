import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/api'
import type { CourseDetail } from '../../types'
import { Plus, Trash2, ChevronLeft, BookOpen, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ModuleManager() {
  const { courseId } = useParams<{ courseId: string }>()
  const qc = useQueryClient()
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [showModuleForm, setShowModuleForm] = useState(false)

  const { data: course } = useQuery<CourseDetail>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}/`).then((r) => r.data),
  })

  const addModuleMutation = useMutation({
    mutationFn: () => api.post(`/courses/${courseId}/modules/`, { title: newModuleTitle, order: (course?.modules?.length || 0) + 1 }),
    onSuccess: () => {
      toast.success('Modul qo\'shildi!')
      qc.invalidateQueries({ queryKey: ['course', courseId] })
      setNewModuleTitle('')
      setShowModuleForm(false)
    },
    onError: () => toast.error('Xato yuz berdi'),
  })

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: number) => api.delete(`/courses/${courseId}/modules/${moduleId}/`),
    onSuccess: () => {
      toast.success('Modul o\'chirildi')
      qc.invalidateQueries({ queryKey: ['course', courseId] })
    },
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/teacher" className="text-gray-500 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{course?.title}</h1>
          <p className="text-sm text-gray-500">Modullar boshqaruvi</p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={() => setShowModuleForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Modul qo'shish
        </button>
      </div>

      {showModuleForm && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3">Yangi modul</h3>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Modul nomi"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addModuleMutation.mutate()}
            />
            <button onClick={() => addModuleMutation.mutate()} className="btn-primary" disabled={!newModuleTitle.trim() || addModuleMutation.isPending}>
              Qo'shish
            </button>
            <button onClick={() => setShowModuleForm(false)} className="btn-secondary">Bekor</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {course?.modules?.map((module) => (
          <div key={module.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen size={18} className="text-blue-500" />
                {module.title}
              </h3>
              <div className="flex gap-2">
                <Link
                  to={`/teacher/courses/${courseId}/modules/${module.id}/lessons`}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  Darslar <ChevronRight size={14} />
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Modulni o\'chirishni tasdiqlaysizmi?')) deleteModuleMutation.mutate(module.id)
                  }}
                  className="btn-danger p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">{module.lessons.length} ta dars</p>
          </div>
        ))}
        {course?.modules?.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
            <p>Hali modul qo'shilmagan</p>
          </div>
        )}
      </div>
    </div>
  )
}
