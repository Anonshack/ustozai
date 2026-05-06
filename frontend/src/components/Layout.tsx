import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { BookOpen, MessageCircle, TrendingUp, User, LogOut, GraduationCap, Menu, X, Shield } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/courses', label: 'Kurslar', icon: BookOpen },
  { to: '/chat', label: 'AI Chat', icon: MessageCircle },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
              <BookOpen size={24} />
              <span>Ustozai</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
              {(user?.role === 'teacher' || user?.role === 'admin') && (
                <Link
                  to="/teacher"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/teacher') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <GraduationCap size={16} />
                  Panel
                </Link>
              )}
              {user?.is_superuser && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin') ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield size={16} />
                  Admin
                </Link>
              )}
            </div>

            {/* User menu */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive('/profile') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User size={16} />
                <span>{user?.first_name}</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut size={16} />
              </button>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(to) ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                }`}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <Link to="/teacher" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600">
                <GraduationCap size={16} /> Panel
              </Link>
            )}
            {user?.is_superuser && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/admin') ? 'bg-red-50 text-red-600' : 'text-gray-600'
                }`}
              >
                <Shield size={16} /> Admin
              </Link>
            )}
            <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600">
              <User size={16} /> {user?.first_name}
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 w-full">
              <LogOut size={16} /> Chiqish
            </button>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
