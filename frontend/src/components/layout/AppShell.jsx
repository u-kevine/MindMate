import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useQuery } from 'react-query'
import { messagesApi } from '../../services/api'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, FolderOpen, MessageSquare, BookOpen,
  Users, BarChart2, User, LogOut, Sun, Moon, Menu, X
} from 'lucide-react'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 
                 bg-white dark:bg-gray-700 text-xs font-bold text-gray-500 dark:text-gray-300
                 hover:border-sage-400 transition-all"
      title="Changer le thème"
    >
      {dark ? <Sun size={13} /> : <Moon size={13} />}
      <span>{dark ? 'Clair' : 'Sombre'}</span>
    </button>
  )
}

function LangToggle() {
  const { cycleLang, t } = useTheme()
  return (
    <button
      onClick={cycleLang}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 
                 bg-white dark:bg-gray-700 text-xs font-bold text-gray-500 dark:text-gray-300
                 hover:border-sage-400 transition-all"
      title="Changer la langue"
    >
      <span>{t('flag')}</span>
      <span>{t('lang_label')}</span>
    </button>
  )
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const { t } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: unreadData } = useQuery(
    'unread-count',
    () => messagesApi.unreadCount().then(r => r.data),
    { refetchInterval: 30_000 }
  )
  const unread = unreadData?.unread_count || 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Déconnexion réussie')
  }

  const navItems = [
    { to: '/',         icon: LayoutDashboard, label: t('dashboard'),  roles: ['student','counselor','admin'] },
    { to: '/cases',    icon: FolderOpen,       label: user?.role === 'student' ? t('my_cases') : t('cases'), roles: ['student','counselor','admin'] },
    { to: '/messages', icon: MessageSquare,    label: t('messages'),  roles: ['student','counselor','admin'], badge: unread },
    { to: '/resources',icon: BookOpen,         label: t('resources'), roles: ['student','counselor','admin'] },
    { to: '/users',    icon: Users,            label: t('users'),     roles: ['admin'] },
    { to: '/reports',  icon: BarChart2,        label: t('reports'),   roles: ['admin','counselor'] },
    { to: '/profile',  icon: User,             label: t('profile'),   roles: ['student','counselor','admin'] },
  ].filter(item => item.roles.includes(user?.role))

  const Sidebar = () => (
    <aside className="sidebar">
      {/* Brand */}
      <div className="px-6 py-7 border-b border-gray-100 dark:border-gray-700">
        <div className="font-display text-2xl text-sage-400">🌿 MindMate</div>
        <div className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">{t('safe_space')}</div>
      </div>

      {/* User chip */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center
                        font-display text-sage-400 font-semibold text-sm flex-shrink-0">
          {user?.initials || 'MM'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{user?.full_name}</div>
          <div className="text-xs text-gray-400 capitalize">{t(user?.role)}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={17} />
            <span className="flex-1">{item.label}</span>
            {item.badge > 0 && (
              <span className="bg-terra-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
        <div className="flex gap-2">
          <ThemeToggle />
          <LangToggle />
        </div>
        <button
          onClick={handleLogout}
          className="nav-item text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 w-full"
        >
          <LogOut size={16} />
          <span>{t('sign_out')}</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-cream dark:bg-gray-900 transition-colors duration-300">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-100
                           dark:border-gray-700 px-6 py-4 flex items-center justify-between
                           transition-colors duration-300">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            {/* breadcrumb placeholder — pages set their own title via <PageHeader> */}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:flex gap-2">
              <ThemeToggle />
              <LangToggle />
            </div>
            {unread > 0 && (
              <NavLink to="/messages" className="relative p-2 rounded-full hover:bg-sage-50">
                <MessageSquare size={18} className="text-sage-400" />
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-terra-400 text-white
                                 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread}
                </span>
              </NavLink>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}