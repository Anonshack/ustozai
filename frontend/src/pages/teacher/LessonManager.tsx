import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Lesson, QuizQuestion } from '../../types'
import { Plus, Trash2, ChevronLeft, Edit, Award } from 'lucide-react'
import toast from 'react-hot-toast'

interface LessonFormData {
  title: string
  content: string
  order: number
}

export default function LessonManager() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>()
  const qc = useQueryClient()
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)
  const [quizLesson, setQuizLesson] = useState<number | null>(null)
  const [lessonForm, setLessonForm] = useState<LessonFormData>({ title: '', content: '', order: 1 })

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons', courseId, moduleId],
    queryFn: () => api.get(`/courses/${courseId}/modules/${moduleId}/lessons/`).then((r) => r.data),
  })

  const { data: quizQuestions } = useQuery<QuizQuestion[]>({
    queryKey: ['quiz', quizLesson],
    queryFn: () => api.get(`/courses/lessons/${quizLesson}/quiz/`).then((r) => r.data),
    enabled: !!quizLesson,
  })

  const saveLessonMutation = useMutation({
    mutationFn: () =>
      editLesson
        ? api.patch(`/courses/${courseId}/modules/${moduleId}/lessons/${editLesson.id}/`, lessonForm)
        : api.post(`/courses/${courseId}/modules/${moduleId}/lessons/`, lessonForm),
    onSuccess: () => {
      toast.success(editLesson ? 'Dars yangilandi!' : 'Dars qo\'shildi!')
      qc.invalidateQueries({ queryKey: ['lessons', courseId, moduleId] })
      setShowLessonForm(false)
      setEditLesson(null)
      setLessonForm({ title: '', content: '', order: 1 })
    },
    onError: () => toast.error('Xato yuz berdi'),
  })

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: number) => api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`),
    onSuccess: () => {
      toast.success('Dars o\'chirildi')
      qc.invalidateQueries({ queryKey: ['lessons', courseId, moduleId] })
    },
  })

  const openEdit = (lesson: Lesson) => {
    setEditLesson(lesson)
    setLessonForm({ title: lesson.title, content: lesson.content, order: lesson.order })
    setShowLessonForm(true)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/teacher/courses/${courseId}/modules`} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Darslar boshqaruvi</h1>
          <p className="text-sm text-gray-500">Modul #{moduleId}</p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setEditLesson(null); setLessonForm({ title: '', content: '', order: (lessons?.length || 0) + 1 }); setShowLessonForm(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Dars qo'shish
        </button>
      </div>

      {showLessonForm && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3">{editLesson ? 'Darsni tahrirlash' : 'Yangi dars'}</h3>
          <div className="space-y-3">
            <input
              className="input"
              placeholder="Dars nomi"
              value={lessonForm.title}
              onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="input"
              rows={8}
              placeholder="Dars matni..."
              value={lessonForm.content}
              onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              placeholder="Tartib raqami"
              value={lessonForm.order}
              onChange={(e) => setLessonForm((f) => ({ ...f, order: Number(e.target.value) }))}
            />
            <div className="flex gap-2">
              <button onClick={() => saveLessonMutation.mutate()} className="btn-primary" disabled={!lessonForm.title.trim() || saveLessonMutation.isPending}>
                {saveLessonMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
              <button onClick={() => { setShowLessonForm(false); setEditLesson(null) }} className="btn-secondary">Bekor</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {lessons?.map((lesson) => (
          <div key={lesson.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{lesson.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lesson.content.substring(0, 100)}...</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => setQuizLesson(quizLesson === lesson.id ? null : lesson.id)} className="btn-secondary p-2" title="Quiz boshqarish">
                  <Award size={16} className={lesson.has_quiz ? 'text-purple-600' : ''} />
                </button>
                <button onClick={() => openEdit(lesson)} className="btn-secondary p-2">
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => { if (confirm('Darsni o\'chirishni tasdiqlaysizmi?')) deleteLessonMutation.mutate(lesson.id) }}
                  className="btn-danger p-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {quizLesson === lesson.id && (
              <QuizManager lessonId={lesson.id} questions={quizQuestions || []} onRefresh={() => qc.invalidateQueries({ queryKey: ['quiz', lesson.id] })} />
            )}
          </div>
        ))}
        {lessons?.length === 0 && (
          <div className="card text-center py-12 text-gray-500">
            <p>Hali dars qo'shilmagan</p>
          </div>
        )}
      </div>
    </div>
  )
}

function QuizManager({ lessonId, questions, onRefresh }: { lessonId: number; questions: QuizQuestion[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ text: '', topic_tag: '', choices: ['', '', '', ''], correct_index: 0 })

  const addMutation = useMutation({
    mutationFn: () =>
      api.post(`/courses/lessons/${lessonId}/quiz/manage/`, {
        text: form.text,
        topic_tag: form.topic_tag,
        choices: form.choices.filter(Boolean).map((text, i) => ({ text, is_correct: i === form.correct_index })),
      }),
    onSuccess: () => {
      toast.success('Savol qo\'shildi!')
      onRefresh()
      setForm({ text: '', topic_tag: '', choices: ['', '', '', ''], correct_index: 0 })
    },
    onError: () => toast.error('Xato yuz berdi'),
  })

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <Award size={16} className="text-purple-600" /> Quiz savollar ({questions.length})
      </h4>
      {questions.map((q, i) => (
        <div key={q.id} className="text-sm bg-gray-50 rounded-lg p-3 mb-2">
          <p className="font-medium">{i + 1}. {q.text}</p>
          <div className="mt-1 space-y-1">
            {q.choices.map((c) => <p key={c.id} className="text-gray-600 pl-4">• {c.text}</p>)}
          </div>
        </div>
      ))}
      <div className="space-y-2 mt-3">
        <input className="input text-sm" placeholder="Savol matni" value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
        <input className="input text-sm" placeholder="Mavzu tegi (masalan: recursion)" value={form.topic_tag} onChange={(e) => setForm((f) => ({ ...f, topic_tag: e.target.value }))} />
        {form.choices.map((c, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="radio"
              name={`correct-${lessonId}`}
              checked={form.correct_index === i}
              onChange={() => setForm((f) => ({ ...f, correct_index: i }))}
              className="text-green-600"
            />
            <input
              className="input text-sm flex-1"
              placeholder={`Variant ${i + 1}`}
              value={c}
              onChange={(e) => {
                const choices = [...form.choices]
                choices[i] = e.target.value
                setForm((f) => ({ ...f, choices }))
              }}
            />
          </div>
        ))}
        <button
          onClick={() => addMutation.mutate()}
          disabled={!form.text.trim() || addMutation.isPending}
          className="btn-primary text-sm"
        >
          {addMutation.isPending ? 'Qo\'shilmoqda...' : 'Savol qo\'shish'}
        </button>
      </div>
    </div>
  )
}
