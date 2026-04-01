import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useQuery } from 'react-query'
import { messagesApi } from '../../services/api'
import toast from 'react-hot-toast'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'
  return (
    <button onClick={toggleTheme}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
        borderRadius: 20, border: '1.5px solid', borderColor: dark ? '#3A4E3E' : '#E2E8F0',
        background: dark ? '#243028' : '#ffffff', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color: dark ? '#B8C4B0' : '#718096',
        transition: 'all .2s'
      }}
      title="Toggle theme"
    >
      <span style={{ fontSize: 14 }}>{dark ? '☀️' : '🌙'}</span>
      <span>{dark ? 'Light' : 'Dark'}</span>
    </button>
  )
}

function LangToggle() {
  const { cycleLang, t } = useTheme()
  return (
    <button onClick={cycleLang}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
        borderRadius: 20, border: '1.5px solid #E2E8F0',
        background: '#ffffff', cursor: 'pointer',
        fontSize: 12, fontWeight: 700, color: '#718096',
        transition: 'all .2s'
      }}
      title="Change language"
    >
      <span style={{ fontSize: 14 }}>{t('flag')}</span>
      <span>{t('lang_label')}</span>
    </button>
  )
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const { t, theme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dark = theme === 'dark'

  const { data: unreadData } = useQuery(
    'unread-count',
    () => messagesApi.unreadCount().then(r => r.data),
    { refetchInterval: 30000 }
  )
  const unread = unreadData?.unread_count || 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Signed out successfully')
  }

  const navItems = [
    { to: '/', icon: '🏠', label: t('dashboard'), roles: ['student', 'counselor', 'admin'] },
    { to: '/cases', icon: '📋', label: user?.role === 'student' ? t('my_cases') : t('cases'), roles: ['student', 'counselor', 'admin'], badge: 0 },
    { to: '/messages', icon: '💬', label: t('messages'), roles: ['student', 'counselor', 'admin'], badge: unread },
    { to: '/resources', icon: '📚', label: t('resources'), roles: ['student', 'counselor', 'admin'] },
    { to: '/users', icon: '👥', label: t('users'), roles: ['admin'] },
    { to: '/reports', icon: '📊', label: t('reports'), roles: ['admin', 'counselor'] },
    { to: '/profile', icon: '👤', label: t('profile'), roles: ['student', 'counselor', 'admin'] },
  ].filter(item => item.roles.includes(user?.role))

  const sidebarBg = dark ? '#1C2420' : '#ffffff'
  const borderColor = dark ? '#3A4E3E' : '#EDF2F7'
  const textPrimary = dark ? '#F0EDE6' : '#2D3748'
  const textMuted = dark ? '#7A9070' : '#A0AEC0'
  const topbarBg = dark ? '#1C2420' : '#ffffff'

  const SidebarContent = () => (
    <div style={{
      width: 260, flexShrink: 0,
      background: sidebarBg,
      borderRight: `1px solid ${borderColor}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      transition: 'background .3s ease'
    }}>
      <div style={{ padding: '22px 22px 16px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#6B8F71', fontWeight: 600 }}>
          🌿 MindMate
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: textMuted, marginTop: 2 }}>
          {t('safe_space')}
        </div>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${borderColor}` }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: dark ? '#2E4035' : '#EBF3EC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600, color: '#6B8F71', flexShrink: 0,
          fontFamily: "'Playfair Display', serif"
        }}>
          {user?.initials || 'MM'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.full_name}
          </div>
          <div style={{ fontSize: 11, color: textMuted, textTransform: 'capitalize' }}>{t(user?.role)}</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ marginBottom: 2 }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span style={{
                background: '#C2714F', color: '#fff', fontSize: 10,
                fontWeight: 700, padding: '1px 7px', borderRadius: 10
              }}>{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '10px 10px 16px', borderTop: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <ThemeToggle />
          <LangToggle />
        </div>
        <button onClick={handleLogout}
          className="nav-item"
          style={{ color: '#E53E3E', width: '100%' }}
          onMouseOver={e => e.currentTarget.style.background = dark ? '#3D1F1F' : '#FFF5F5'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 16 }}>🚪</span>
          <span>{t('sign_out')}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: dark ? '#172018' : '#FAF7F2', transition: 'background .3s ease' }}>
      <div style={{ display: 'none' }} className="lg:block">
        <SidebarContent />
      </div>
      <div className="hidden lg:block">
        <SidebarContent />
      </div>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position: 'relative', zIndex: 10 }}><SidebarContent /></div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          background: topbarBg, borderBottom: `1px solid ${borderColor}`,
          padding: '14px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', gap: 10,
          position: 'sticky', top: 0, zIndex: 40,
          transition: 'background .3s ease'
        }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ display: 'flex', padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: textPrimary }}
            className="lg:hidden"
          >
            ☰
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <ThemeToggle />
            <LangToggle />
            {unread > 0 && (
              <NavLink to="/messages" style={{ position: 'relative', padding: 8, borderRadius: '50%', display: 'flex', textDecoration: 'none', color: '#6B8F71' }}>
                💬
                <span style={{
                  position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                  background: '#C2714F', color: '#fff', fontSize: 10, fontWeight: 700,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{unread}</span>
              </NavLink>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto' }} className="animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}