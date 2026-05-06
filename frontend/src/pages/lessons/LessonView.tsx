import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useLocation, Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Lesson, QuizQuestion, QuizResult } from '../../types'
import { CheckCircle, XCircle, MessageCircle, ChevronLeft, Award } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LessonView() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const lesson = location.state?.lesson as Lesson | undefined
  const courseId = location.state?.courseId as number | undefined

  const [quizMode, setQuizMode] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuizResult | null>(null)

  const { data: quiz } = useQuery<QuizQuestion[]>({
    queryKey: ['quiz', id],
    queryFn: () => api.get(`/courses/lessons/${id}/quiz/`).then((r) => r.data),
    enabled: quizMode && lesson?.lesson_type === 'quiz',
  })

  const completeMutation = useMutation({
    mutationFn: () => api.post('/progress/complete-lesson/', { lesson_id: Number(id) }),
    onSuccess: () => toast.success('Dars tugallandi!'),
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Xato'),
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post(`/courses/lessons/${id}/quiz/submit/`, {
        answers: Object.entries(answers).map(([question_id, choice_id]) => ({
          question_id: Number(question_id),
          choice_id,
        })),
      }),
    onSuccess: (res) => {
      setResult(res.data)
      if (res.data.passed) toast.success(`Quiz o'tdi! Ball: ${res.data.score}%`)
      else toast.error(`Quiz o'tmadi. Ball: ${res.data.score}%`)
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Xato'),
  })

  if (!lesson) return (
    <div className="max-w-3xl mx-auto text-center py-16">
      <p className="text-gray-500 mb-4">Dars topilmadi</p>
      <Link to={courseId ? `/courses/${courseId}` : '/courses'} className="btn-primary">
        Kursga qaytish
      </Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={courseId ? `/courses/${courseId}` : '/courses'} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">{lesson.title}</h1>
        <Link to={`/chat/new?lesson=${id}`} className="btn-secondary flex items-center gap-2 text-sm">
          <MessageCircle size={16} /> AI bilan muhokama
        </Link>
      </div>

      {!quizMode ? (
        <>
          <div className="card mb-6">
            <div
              className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {completeMutation.isPending ? 'Saqlanmoqda...' : 'Darsni tugatdim'}
            </button>
            {lesson.lesson_type === 'quiz' && (
              <button onClick={() => setQuizMode(true)} className="btn-secondary flex items-center gap-2">
                <Award size={16} /> Quizni boshlash
              </button>
            )}
          </div>
        </>
      ) : result ? (
        <div className="card">
          <div className={`text-center mb-6 p-6 rounded-xl ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
            {result.passed
              ? <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
              : <XCircle className="mx-auto text-red-500 mb-2" size={48} />}
            <h2 className="text-2xl font-bold mb-1">{result.passed ? "O'tdingiz!" : "O'tmadingiz"}</h2>
            <p className="text-4xl font-bold text-gray-800">{result.score}%</p>
            <p className="text-sm text-gray-500 mt-1">70% dan yuqori bo'lsa o'tadi</p>
          </div>
          <div className="space-y-4">
            {result.answers.map((a, i) => (
              <div key={i} className={`p-4 rounded-lg border ${a.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className="font-medium mb-2">{a.question_text}</p>
                <p className="text-sm">
                  Sizning javobingiz:{' '}
                  <span className={a.is_correct ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>{a.chosen_text}</span>
                </p>
                {!a.is_correct && <p className="text-sm text-green-700 mt-1">To'g'ri javob: <strong>{a.correct_choice}</strong></p>}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { setResult(null); setAnswers({}) }} className="btn-secondary">Qayta urinish</button>
            <button onClick={() => setQuizMode(false)} className="btn-primary">Darsga qaytish</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="text-xl font-bold mb-6">Quiz</h2>
          {quiz?.map((q, qi) => (
            <div key={q.id} className="mb-6">
              <p className="font-medium mb-3">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.choices.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[q.id] === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === c.id}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: c.id }))}
                    />
                    <span className="text-sm">{c.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-3">
            <button onClick={() => setQuizMode(false)} className="btn-secondary">Bekor qilish</button>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || Object.keys(answers).length !== (quiz?.length || 0)}
              className="btn-primary"
            >
              {submitMutation.isPending ? 'Yuborilmoqda...' : 'Javoblarni yuborish'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
