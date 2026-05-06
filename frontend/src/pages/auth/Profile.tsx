import { useState, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { User, Save, Camera } from 'lucide-react'
import api from '../../lib/api'

const LEVEL_LABELS: Record<string, string> = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' }
const LANG_LABELS: Record<string, string> = { uz: "O'zbek", ru: 'Rus', en: 'Ingliz' }
const ROLE_LABELS: Record<string, string> = { student: "O'quvchi", teacher: "O'qituvchi", admin: 'Admin' }

export default function Profile() {
  const { user, fetchMe } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    level: user?.level || 'beginner',
    language: user?.language || 'uz',
  })
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (avatarFile) {
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => fd.append(k, v))
        fd.append('avatar', avatarFile)
        await api.patch('/auth/me/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.patch('/auth/me/', form)
      }
      await fetchMe()
      toast.success('Profil yangilandi!')
    } catch {
      toast.error('Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const avatarSrc = avatarPreview || (user?.avatar ? user.avatar : null)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="text-blue-600" size={36} />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1"
            >
              <Camera size={12} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.first_name} {user?.last_name}</h1>
            <span className="text-sm text-gray-500">{user?.email}</span>
            <div className="flex gap-2 mt-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {ROLE_LABELS[user?.role || ''] || user?.role}
              </span>
              {user?.is_superuser && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Superuser</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Profilni tahrirlash</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ism</label>
              <input className="input" value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Familiya</label>
              <input className="input" value={form.last_name} onChange={(e) => setField('last_name', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input className="input" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+998 90 123 45 67" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea className="input" rows={3} value={form.bio} onChange={(e) => setField('bio', e.target.value)} placeholder="O'zingiz haqingizda qisqacha..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Daraja</label>
              <select className="input" value={form.level} onChange={(e) => setField('level', e.target.value)}>
                {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Til</label>
              <select className="input" value={form.language} onChange={(e) => setField('language', e.target.value)}>
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
