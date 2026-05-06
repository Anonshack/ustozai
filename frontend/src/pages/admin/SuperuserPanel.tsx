import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import type { AdminUser, AdminStats, AdminConversation, AdminCourse } from '../../types'
import {
  Users, BookOpen, MessageCircle, TrendingUp, Shield,
  UserCheck, UserX, Flag, Trash2, CheckCircle, XCircle,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'stats' | 'users' | 'courses' | 'conversations'

function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function StatsTab() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/auth/admin/stats/').then((r) => r.data),
  })

  if (isLoading) return <div className="animate-pulse space-y-4">{[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div>

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard label="Jami foydalanuvchilar" value={stats.total_users} icon={Users} color="bg-blue-500" />
      <StatsCard label="O'quvchilar" value={stats.total_students} icon={Users} color="bg-green-500" />
      <StatsCard label="O'qituvchilar" value={stats.total_teachers} icon={UserCheck} color="bg-purple-500" />
      <StatsCard label="Faol foydalanuvchilar" value={stats.active_users} icon={TrendingUp} color="bg-indigo-500" />
      <StatsCard label="Jami kurslar" value={stats.total_courses} icon={BookOpen} color="bg-orange-500" />
      <StatsCard label="Nashr qilingan" value={stats.published_courses} icon={CheckCircle} color="bg-teal-500" />
      <StatsCard label="Yozilishlar" value={stats.total_enrollments} icon={BookOpen} color="bg-pink-500" />
      <StatsCard label="Belgilangan chatlar" value={stats.flagged_conversations} icon={Flag} color="bg-red-500" />
    </div>
  )
}

function UsersTab() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const qc = useQueryClient()

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      return api.get(`/auth/admin/users/?${params}`).then((r) => Array.isArray(r.data) ? r.data : r.data.results ?? [])
    },
  })

  const assignRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api.post(`/auth/admin/users/${id}/assign-role/`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Rol tayinlandi')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Xato'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/auth/admin/users/${id}/toggle-active/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Holat yangilandi')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Xato'),
  })

  const ROLE_OPTIONS = [
    { value: 'student', label: "O'quvchi" },
    { value: 'teacher', label: "O'qituvchi" },
    { value: 'admin', label: 'Admin' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Email, ism yoki familiya bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Barcha rollar</option>
          <option value="student">O'quvchi</option>
          <option value="teacher">O'qituvchi</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {users?.map((u) => (
            <div key={u.id} className={`card flex items-center gap-4 ${!u.is_active ? 'opacity-60' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-blue-600 font-semibold text-sm">
                    {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{u.first_name} {u.last_name}</p>
                  {u.is_superuser && <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">Superuser</span>}
                  {!u.is_active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Nofaol</span>}
                </div>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!u.is_superuser && (
                  <>
                    <select
                      value={u.role}
                      onChange={(e) => assignRoleMutation.mutate({ id: u.id, role: e.target.value })}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
                      disabled={assignRoleMutation.isPending}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => toggleActiveMutation.mutate(u.id)}
                      disabled={toggleActiveMutation.isPending}
                      className={`p-2 rounded-lg transition-colors ${
                        u.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={u.is_active ? "Nofaol qilish" : "Faollashtirish"}
                    >
                      {u.is_active ? <UserCheck size={18} /> : <UserX size={18} />}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {users?.length === 0 && (
            <div className="card text-center py-8 text-gray-500">Foydalanuvchi topilmadi</div>
          )}
        </div>
      )}
    </div>
  )
}

function CoursesTab() {
  const qc = useQueryClient()

  const { data: courses, isLoading } = useQuery<AdminCourse[]>({
    queryKey: ['admin-courses'],
    queryFn: () => api.get('/auth/admin/courses/').then((r) => Array.isArray(r.data) ? r.data : r.data.results ?? []),
  })

  const togglePublishMutation = useMutation({
    mutationFn: (id: number) => api.post(`/auth/admin/courses/${id}/toggle-publish/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Kurs holati yangilandi')
    },
    onError: () => toast.error('Xato'),
  })

  const LEVEL_LABELS: Record<string, string> = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' }

  if (isLoading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>

  return (
    <div className="space-y-2">
      {courses?.map((c) => (
        <div key={c.id} className="card flex items-center gap-4">
          <BookOpen className="text-blue-500 flex-shrink-0" size={24} />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{c.title}</p>
            <p className="text-sm text-gray-500">{c.teacher_name} · {LEVEL_LABELS[c.level] || c.level} · {c.enrollment_count} yozilish</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {c.is_published ? 'Nashr' : 'Qoralama'}
            </span>
            <button
              onClick={() => togglePublishMutation.mutate(c.id)}
              disabled={togglePublishMutation.isPending}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={c.is_published ? "Qoralamaga qaytarish" : "Nashr qilish"}
            >
              {c.is_published ? <XCircle size={18} /> : <CheckCircle size={18} />}
            </button>
          </div>
        </div>
      ))}
      {courses?.length === 0 && (
        <div className="card text-center py-8 text-gray-500">Kurs topilmadi</div>
      )}
    </div>
  )
}

function ConversationsTab() {
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const qc = useQueryClient()

  const { data: conversations, isLoading } = useQuery<AdminConversation[]>({
    queryKey: ['admin-conversations', flaggedOnly],
    queryFn: () => {
      const params = flaggedOnly ? '?flagged=true' : ''
      return api.get(`/auth/admin/conversations/${params}`).then((r) => Array.isArray(r.data) ? r.data : r.data.results ?? [])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/admin/conversations/${id}/delete/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-conversations'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success("Suhbat o'chirildi")
    },
    onError: () => toast.error("O'chirib bo'lmadi"),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => setFlaggedOnly(e.target.checked)}
            className="w-4 h-4 accent-red-500"
          />
          <span className="text-sm font-medium text-red-600 flex items-center gap-1">
            <Flag size={14} /> Faqat belgilanganlar
          </span>
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {conversations?.map((c) => (
            <div key={c.id} className={`card flex items-center gap-4 ${c.is_flagged ? 'border-red-200 bg-red-50' : ''}`}>
              <MessageCircle className={c.is_flagged ? 'text-red-500' : 'text-gray-400'} size={20} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{c.title || 'Nomsiz suhbat'}</p>
                  {c.is_flagged && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Flag size={10} /> {c.flag_reason || 'Belgilangan'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{c.student_name} ({c.student_email}) · {c.message_count} xabar</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Suhbatni o'chirishni tasdiqlaysizmi?")) {
                    deleteMutation.mutate(c.id)
                  }
                }}
                disabled={deleteMutation.isPending}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {conversations?.length === 0 && (
            <div className="card text-center py-8 text-gray-500">Suhbat topilmadi</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SuperuserPanel() {
  const [tab, setTab] = useState<Tab>('stats')

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'stats', label: 'Statistika', icon: TrendingUp },
    { id: 'users', label: 'Foydalanuvchilar', icon: Users },
    { id: 'courses', label: 'Kurslar', icon: BookOpen },
    { id: 'conversations', label: 'Suhbatlar', icon: MessageCircle },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <Shield className="text-red-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Superuser Panel</h1>
          <p className="text-sm text-gray-500">Tizimni boshqarish va monitoring</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'courses' && <CoursesTab />}
      {tab === 'conversations' && <ConversationsTab />}
    </div>
  )
}
