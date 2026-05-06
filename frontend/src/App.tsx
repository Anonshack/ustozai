import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Profile from './pages/auth/Profile'

import Home from './pages/Home'
import CourseList from './pages/courses/CourseList'
import CourseDetail from './pages/courses/CourseDetail'
import LessonView from './pages/lessons/LessonView'
import ChatPage from './pages/chat/ChatPage'
import ProgressDashboard from './pages/progress/ProgressDashboard'

import TeacherPanel from './pages/teacher/TeacherPanel'
import ModuleManager from './pages/teacher/ModuleManager'
import LessonManager from './pages/teacher/LessonManager'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
})

function App() {
  const { isAuthenticated, fetchMe } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('access_token')) {
      fetchMe().catch(() => {})
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/courses" element={<CourseList />} />
                    <Route path="/courses/:id" element={<CourseDetail />} />
                    <Route path="/lessons/:id" element={<LessonView />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/chat/new" element={<ChatPage />} />
                    <Route path="/chat/:id" element={<ChatPage />} />
                    <Route path="/progress" element={<ProgressDashboard />} />

                    {/* Teacher routes */}
                    <Route
                      path="/teacher"
                      element={
                        <ProtectedRoute roles={['teacher', 'admin']}>
                          <TeacherPanel />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teacher/courses/:courseId/modules"
                      element={
                        <ProtectedRoute roles={['teacher', 'admin']}>
                          <ModuleManager />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teacher/courses/:courseId/modules/:moduleId/lessons"
                      element={
                        <ProtectedRoute roles={['teacher', 'admin']}>
                          <LessonManager />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
