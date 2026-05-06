import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { BookOpen } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Xush kelibsiz!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login xatosi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="card w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="text-blue-600" size={28} />
          <span className="text-2xl font-bold text-blue-600">Ustozai</span>
        </div>
        <h1 className="text-2xl font-bold mb-6">Kirish</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parol</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Hisobingiz yo'qmi?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">Ro'yxatdan o'ting</Link>
        </p>
      </div>
    </div>
  )
}
