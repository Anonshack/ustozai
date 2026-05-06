import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { User, Save } from 'lucide-react'

const LEVEL_LABELS: Record<string, string> = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' }
const LANG_LABELS: Record<string, string> = { uz: "O'zbek", ru: 'Rus', en: 'Ingliz' }
const ROLE_LABELS: Record<string, string> = { student: "O'quvchi", teacher: "O'qituvchi", admin: 'Admin' }

export default function Profile() {
  const { user, updateProfile } = useAuthStore()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    level: user?.level || 'beginner',
    language: user?.language || 'uz',
  })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(form)
      toast.success('Profil yangilandi!')
    } catch {
      toast.error('Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h1>
          <span className="text-sm text-gray-500">{user?.email} · {ROLE_LABELS[user?.role || '']}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Profilni tahrirlash</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ism</label>
              <input className="input" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Familiya</label>
              <input className="input" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Daraja</label>
              <select className="input" value={form.level} onChange={(e) => set('level', e.target.value)}>
                {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Til</label>
              <select className="input" value={form.language} onChange={(e) => set('language', e.target.value)}>
                {Object.entries(LANG_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            <Save size={16} />
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      </div>
    </div>
  )
}
