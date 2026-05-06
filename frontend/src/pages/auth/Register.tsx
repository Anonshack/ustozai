import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { BookOpen } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({
    email: '', password: '', password2: '', first_name: '', last_name: '',
    level: 'beginner', language: 'uz',
  })
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password2) {
      toast.error('Parollar mos kelmaydi')
      return
    }
    setLoading(true)
    try {
      await register(form)
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!")
      navigate('/')
    } catch (err: any) {
      const errors = err.response?.data
      const msg = errors ? Object.values(errors).flat().join(', ') : 'Xato yuz berdi'
      toast.error(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="card w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="text-blue-600" size={28} />
          <span className="text-2xl font-bold text-blue-600">Ustozai</span>
        </div>
        <h1 className="text-2xl font-bold mb-6">Ro'yxatdan o'tish</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ism</label>
              <input className="input" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required placeholder="Ali" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Familiya</label>
              <input className="input" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required placeholder="Valiyev" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parol</label>
            <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder="••••••••" minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parolni tasdiqlang</label>
            <input className="input" type="password" value={form.password2} onChange={(e) => set('password2', e.target.value)} required placeholder="••••••••" />
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
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Hisobingiz bormi?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Kirish</Link>
        </p>
      </div>
    </div>
  )
}
