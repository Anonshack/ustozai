import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import type { Course, Category } from '../../types'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

interface Props {
  course?: Course | null
  onClose: () => void
  onSuccess: () => void
}

export default function CourseForm({ course, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: course?.title || '',
    description: course?.description || '',
    level: course?.level || 'beginner',
    language: course?.language || 'uz',
    category: course?.category?.id?.toString() || '',
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/courses/categories/').then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: () =>
      course
        ? api.patch(`/courses/${course.id}/`, { ...form, category: form.category || null })
        : api.post('/courses/', { ...form, category: form.category || null }),
    onSuccess: () => {
      toast.success(course ? 'Kurs yangilandi!' : 'Kurs yaratildi!')
      onSuccess()
    },
    onError: (err: any) => {
      const errors = err.response?.data
      toast.error(errors ? Object.values(errors).flat().join(', ') : 'Xato yuz berdi')
    },
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{course ? 'Kursni tahrirlash' : 'Yangi kurs'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kurs nomi</label>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="Python asoslari" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tavsif</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Kurs haqida..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Daraja</label>
            <select className="input" value={form.level} onChange={(e) => set('level', e.target.value)}>
              <option value="beginner">Boshlang'ich</option>
              <option value="intermediate">O'rta</option>
              <option value="advanced">Yuqori</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Til</label>
            <select className="input" value={form.language} onChange={(e) => set('language', e.target.value)}>
              <option value="uz">O'zbek</option>
              <option value="ru">Rus</option>
              <option value="en">Ingliz</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kategoriya</label>
          <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Kategoriyasiz</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  )
}
