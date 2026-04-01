import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Pages
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AppShell     from './components/layout/AppShell'
import Dashboard    from './pages/Dashboard'
import CasesPage    from './pages/CasesPage'
import CaseDetail   from './pages/CaseDetail'
import MessagesPage from './pages/MessagesPage'
import ResourcesPage from './pages/ResourcesPage'
import UsersPage    from './pages/UsersPage'
import ReportsPage  from './pages/ReportsPage'
import ProfilePage  from './pages/ProfilePage'
import NotFound     from './pages/NotFound'

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-cream dark:bg-gray-900">
      <div className="text-center">
        <div className="text-4xl mb-4">🌿</div>
        <div className="text-sage-400 font-body text-sm animate-pulse">Chargement de MindMate…</div>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected App */}
          <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="cases" element={<CasesPage />} />
            <Route path="cases/:id" element={<CaseDetail />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="users"   element={<PrivateRoute roles={['admin']}><UsersPage /></PrivateRoute>} />
            <Route path="reports" element={<PrivateRoute roles={['admin','counselor']}><ReportsPage /></PrivateRoute>} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}