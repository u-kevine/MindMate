import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { authApi, casesApi, resourcesApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

function StatCard({ label, value, change, icon, color = '#EBF3EC', textColor = '#27500A' }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value ?? 0}</div>
          {change && <div className="stat-change">{change}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: textColor }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
        <div style={{ color: '#6B8F71', fontSize: 14 }}>Loading…</div>
      </div>
    </div>
  )
}

function StudentDashboard({ stats }) {
  const { user } = useAuth()
  const { t } = useTheme()
  const { data: casesData } = useQuery('my-cases-dash', () => casesApi.list({ status: 'in_progress' }).then(r => r.data))
  const { data: resData } = useQuery('featured-res', () => resourcesApi.list({ is_featured: true }).then(r => r.data))
  const activeCase = casesData?.results?.[0]

  return (
    <div className="animate-fade-in" style={{ padding: '0 0 32px' }}>
      <div className="welcome-banner">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8, fontWeight: 600 }}>
            {t('hello')}, {user?.full_name?.split(' ')[0]} 🌱
          </h2>
          <p style={{ fontSize: 14, opacity: 0.88, maxWidth: 420, lineHeight: 1.6 }}>{t('not_alone')}</p>
        </div>
        <span style={{ fontSize: 60, opacity: 0.75 }}>🌿</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label={t('active_requests')} value={stats?.active_cases} icon="📋" />
        <StatCard label={t('unread_msgs')} value={stats?.unread_messages} icon="💬" color="#BEE3F8" textColor="#2B6CB0" />
        <StatCard label={t('resources_read')} value={stats?.resources_read ?? 7} icon="📚" color="#FBF5E0" textColor="#744210" />
        <StatCard label={t('sessions_done')} value={stats?.total_cases} icon="✅" color="#FED7D7" textColor="#C53030" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div className="card">
          <div className="card-title">{t('active_case')}</div>
          <div className="card-sub">{t('your_case')}</div>
          {activeCase ? (
            <div style={{ background: '#EBF3EC', borderRadius: 12, padding: 16, borderLeft: '4px solid #6B8F71' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'inherit' }}>{activeCase.title}</div>
                  <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{activeCase.case_number} · {activeCase.counselor_name || 'Unassigned'}</div>
                </div>
                <span className="badge badge-progress">In Progress</span>
              </div>
              <div className="progress-track" style={{ margin: '10px 0 4px' }}>
                <div className="progress-fill" style={{ width: activeCase.progress_percent + '%' }} />
              </div>
              <div style={{ fontSize: 11, color: '#6B8F71' }}>{activeCase.progress_percent}% resolved</div>
              <Link to={`/cases/${activeCase.id}`} className="btn btn-outline btn-sm" style={{ marginTop: 14, display: 'inline-flex' }}>
                View case →
              </Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#A0AEC0' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No active cases</div>
              <p style={{ fontSize: 13 }}>Submit a support request to get started.</p>
              <Link to="/cases" className="btn btn-terra btn-sm" style={{ marginTop: 14, display: 'inline-flex' }}>+ New Request</Link>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>{t('next_session')}</div>
            <div style={{ background: '#FBF5E0', borderRadius: 12, padding: 14, borderLeft: '4px solid #B5860D', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>📅 Thursday, March 27</div>
              <div style={{ fontSize: 12, color: '#854F0B', margin: '3px 0' }}>2:00 PM – 3:00 PM</div>
              <div style={{ fontSize: 12, color: '#718096' }}>With counselor</div>
              <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>📍 Room 204, Counseling Center</div>
            </div>
            <button className="btn btn-outline btn-sm">Confirm</button>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 10 }}>{t('quick_access')}</div>
            {[
              { icon: '💬', label: t('contact_counselor'), to: '/messages', bg: '#EBF3EC' },
              { icon: '📚', label: t('explore_resources'), to: '/resources', bg: '#FBF5E0' },
            ].map(({ icon, label, to, bg }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, background: bg, marginBottom: 8, textDecoration: 'none',
                fontSize: 13, fontWeight: 600, color: '#2D3748', transition: 'opacity .2s'
              }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span>{label}</span>
                <span style={{ marginLeft: 'auto', color: '#A0AEC0' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {resData?.results?.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">{t('recommended')}</div>
          <div className="card-sub">{t('based_on')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {resData.results.slice(0, 3).map(r => (
              <Link key={r.id} to="/resources" style={{
                display: 'block', padding: 14, borderRadius: 12, textDecoration: 'none',
                background: r.category_color || '#EBF3EC', transition: 'opacity .2s'
              }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>{r.category_icon || '📄'}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#2D3748', marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: '#718096' }}>{r.read_time_minutes} min read</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CounselorDashboard({ stats }) {
  const { user } = useAuth()
  const { t } = useTheme()
  const { data: casesData } = useQuery('counselor-cases-dash', () => casesApi.list({ status: 'open' }).then(r => r.data))

  return (
    <div className="animate-fade-in">
      <div className="welcome-banner">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>
            Welcome back, {user?.full_name?.split(' ').pop()} 💙
          </h2>
          <p style={{ fontSize: 14, opacity: 0.88, maxWidth: 400, lineHeight: 1.6 }}>
            You are making a real difference. Here is your overview for today.
          </p>
        </div>
        <span style={{ fontSize: 60, opacity: 0.75 }}>🧑‍⚕️</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Open Cases" value={stats?.open_cases} icon="📋" color="#FED7D7" textColor="#C53030" />
        <StatCard label="In Progress" value={stats?.in_progress_cases} icon="🔄" color="#BEE3F8" textColor="#2B6CB0" />
        <StatCard label="Resolved (Month)" value={stats?.resolved_cases} icon="✅" />
        <StatCard label="Total Assigned" value={stats?.total_assigned} icon="📊" color="#FBF5E0" textColor="#744210" />
      </div>

      <div className="card">
        <div className="card-title">Open Cases</div>
        <div className="card-sub">Cases that need your attention</div>
        {casesData?.results?.length > 0 ? (
          <div className="table-container">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Case #</th><th>Student</th><th>Type</th>
                  <th>Priority</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {casesData.results.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: '#6B8F71' }}>{c.case_number}</td>
                    <td>{c.student_name}</td>
                    <td style={{ color: '#718096', textTransform: 'capitalize' }}>{c.case_type}</td>
                    <td><span className={`badge badge-${c.priority}`}>{c.priority}</span></td>
                    <td style={{ color: '#A0AEC0', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td><Link to={`/cases/${c.id}`} className="btn btn-outline btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#A0AEC0' }}>
            <div style={{ fontSize: 36 }}>✅</div>
            <div style={{ fontWeight: 600, marginTop: 8 }}>All caught up!</div>
            <p style={{ fontSize: 13, marginTop: 4 }}>No open cases right now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminDashboard({ stats }) {
  const { data: caseStats } = useQuery('case-stats-dash', () => casesApi.stats().then(r => r.data))
  const byType = caseStats?.by_type || {}
  const total = Object.values(byType).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="animate-fade-in">
      <div className="welcome-banner">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>
            System Overview 🛠️
          </h2>
          <p style={{ fontSize: 14, opacity: 0.88, lineHeight: 1.6 }}>
            MindMate is running smoothly. Here is a real-time summary.
          </p>
        </div>
        <span style={{ fontSize: 60, opacity: 0.75 }}>📊</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Students" value={stats?.total_students} icon="👩‍🎓" />
        <StatCard label="Counselors" value={stats?.total_counselors} icon="🧑‍⚕️" color="#BEE3F8" textColor="#2B6CB0" />
        <StatCard label="Open Cases" value={stats?.open_cases} icon="📋" color="#FED7D7" textColor="#C53030" />
        <StatCard label="Resources" value={stats?.total_resources} icon="📚" color="#FBF5E0" textColor="#744210" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title">Cases by Type</div>
          <div className="card-sub">Distribution this month</div>
          {[
            { key: 'academic', label: 'Academic Stress', color: '#6B8F71' },
            { key: 'anxiety', label: 'Anxiety', color: '#4299E1' },
            { key: 'grief', label: 'Grief & Loss', color: '#B5860D' },
            { key: 'relationship', label: 'Relationships', color: '#C2714F' },
          ].map(({ key, label, color }) => {
            const count = byType[key] || 0
            const pct = Math.round((count / total) * 100)
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: '#4A5568' }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{pct}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: pct + '%', background: color }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div className="card-title">Recent Activity</div>
          <div className="card-sub">System events</div>
          {[
            { dot: '#6B8F71', text: 'New support request submitted', time: '10 min ago' },
            { dot: '#B5860D', text: 'Case resolved by counselor', time: '1 hour ago' },
            { dot: '#4299E1', text: 'New student registered', time: '2 hours ago' },
            { dot: '#C2714F', text: 'New resource uploaded', time: 'Yesterday' },
            { dot: '#6B8F71', text: 'Monthly report generated', time: '2 days ago' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F7FAFC' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: a.dot, marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: '#4A5568' }}>{a.text}</div>
                <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useQuery(
    'dashboard-stats',
    () => authApi.dashboardStats().then(r => r.data),
    { staleTime: 60000 }
  )
  if (isLoading) return <PageLoader />
  if (user?.role === 'student')   return <StudentDashboard stats={stats} />
  if (user?.role === 'counselor') return <CounselorDashboard stats={stats} />
  return <AdminDashboard stats={stats} />
}