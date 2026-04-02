import { useQuery } from 'react-query'
import { casesApi, authApi } from '../services/api'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

function StatCard({ label, value, icon, color = '#EBF3EC', textColor = '#27500A', change }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A0AEC0', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 600 }}>
            {value ?? 0}
          </div>
          {change && (
            <div style={{ fontSize: 11, color: '#6B8F71', marginTop: 4 }}>{change}</div>
          )}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: textColor, flexShrink: 0
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

const MONTHLY_DATA = [
  { month: 'Oct', cases: 12, resolved: 9  },
  { month: 'Nov', cases: 18, resolved: 14 },
  { month: 'Dec', cases: 9,  resolved: 8  },
  { month: 'Jan', cases: 22, resolved: 16 },
  { month: 'Feb', cases: 27, resolved: 20 },
  { month: 'Mar', cases: 31, resolved: 25 },
]

const BAR_COLORS = {
  academic:     { label: 'Academic Stress',  color: '#6B8F71' },
  anxiety:      { label: 'Anxiety',           color: '#4299E1' },
  grief:        { label: 'Grief & Loss',      color: '#B5860D' },
  relationship: { label: 'Relationships',     color: '#C2714F' },
  depression:   { label: 'Depression',        color: '#805AD5' },
  trauma:       { label: 'Trauma',            color: '#E53E3E' },
  other:        { label: 'Other',             color: '#718096' },
}

export default function ReportsPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const textMuted   = dark ? '#7A9070' : '#A0AEC0'
  const borderColor = dark ? '#3A4E3E' : '#EDF2F7'
  const textPrimary = dark ? '#F0EDE6' : '#2D3748'

  const { data: stats } = useQuery(
    'case-stats-reports',
    () => casesApi.stats().then(r => r.data)
  )

  const { data: dashStats } = useQuery(
    'dashboard-stats-reports',
    () => authApi.dashboardStats().then(r => r.data)
  )

  const byType    = stats?.by_type    || {}
  const totalType = Object.values(byType).reduce((a, b) => a + b, 0) || 1
  const maxMonthly = Math.max(...MONTHLY_DATA.map(d => d.cases), 1)

  return (
    <div className="animate-fade-in">

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
            Reports & Analytics
          </h1>
          <p style={{ fontSize: 13, color: textMuted }}>System-wide statistics and performance overview</p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => toast('PDF export coming soon 📄')}
        >
          📄 Export PDF
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Open Cases"
          value={stats?.open}
          icon="📋"
          color="#FED7D7"
          textColor="#C53030"
          change="Needs attention"
        />
        <StatCard
          label="In Progress"
          value={stats?.in_progress}
          icon="🔄"
          color="#BEE3F8"
          textColor="#2B6CB0"
          change="Being handled"
        />
        <StatCard
          label="Resolved"
          value={stats?.resolved}
          icon="✅"
          color="#C6F6D5"
          textColor="#276749"
          change="Successfully closed"
        />
        <StatCard
          label="Urgent Cases"
          value={stats?.urgent}
          icon="🚨"
          color="#FED7D7"
          textColor="#C53030"
          change="Immediate attention"
        />
      </div>

      {/* ── Second row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Total Students"
          value={dashStats?.total_students}
          icon="👩‍🎓"
          change="Registered users"
        />
        <StatCard
          label="Active Counselors"
          value={dashStats?.total_counselors}
          icon="🧑‍⚕️"
          color="#BEE3F8"
          textColor="#2B6CB0"
          change="Available for cases"
        />
        <StatCard
          label="Resolution Rate"
          value={stats?.resolved && stats?.open
            ? Math.round((stats.resolved / (stats.resolved + stats.open)) * 100) + '%'
            : '—'}
          icon="📈"
          color="#FBF5E0"
          textColor="#744210"
          change="This month"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* ── Cases by type ── */}
        <div className="card">
          <div className="card-title">Cases by Type</div>
          <div className="card-sub" style={{ marginBottom: 16 }}>Distribution across all time</div>
          {Object.entries(BAR_COLORS).map(([key, { label, color }]) => {
            const count = byType[key] || 0
            const pct   = Math.round((count / totalType) * 100)
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: textPrimary }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{count} ({pct}%)</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: pct + '%', background: color }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Monthly trend ── */}
        <div className="card">
          <div className="card-title">Monthly Trend</div>
          <div className="card-sub" style={{ marginBottom: 16 }}>Cases submitted vs resolved</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160, marginBottom: 12 }}>
            {MONTHLY_DATA.map(d => (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', display: 'flex', gap: 3, alignItems: 'flex-end', height: 130 }}>
                  <div style={{
                    flex: 1, background: '#6B8F71', borderRadius: '4px 4px 0 0',
                    height: Math.round((d.cases / maxMonthly) * 120) + 'px',
                    minHeight: 4, transition: 'height .5s ease'
                  }} title={`${d.cases} submitted`} />
                  <div style={{
                    flex: 1, background: '#A8C5AC', borderRadius: '4px 4px 0 0',
                    height: Math.round((d.resolved / maxMonthly) * 120) + 'px',
                    minHeight: 4, transition: 'height .5s ease'
                  }} title={`${d.resolved} resolved`} />
                </div>
                <div style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>{d.month}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: textPrimary }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#6B8F71' }} />
              Submitted
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: textPrimary }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#A8C5AC' }} />
              Resolved
            </div>
          </div>
        </div>
      </div>

      {/* ── Monthly summary table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${borderColor}` }}>
          <div className="card-title" style={{ marginBottom: 2 }}>Monthly Summary</div>
          <div style={{ fontSize: 12, color: textMuted }}>Last 6 months performance</div>
        </div>
        <div className="table-container">
          <table className="mm-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Cases Submitted</th>
                <th>Resolved</th>
                <th>Resolution Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY_DATA.map(d => {
                const rate = Math.round((d.resolved / d.cases) * 100)
                return (
                  <tr key={d.month}>
                    <td style={{ fontWeight: 700 }}>{d.month} 2025</td>
                    <td>{d.cases}</td>
                    <td style={{ color: '#6B8F71', fontWeight: 600 }}>{d.resolved}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-track" style={{ width: 80 }}>
                          <div className="progress-fill" style={{ width: rate + '%' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: rate >= 80 ? '#276749' : rate >= 60 ? '#B7791F' : '#C53030' }}>
                          {rate}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${rate >= 80 ? 'badge-resolved' : rate >= 60 ? 'badge-open' : 'badge-urgent'}`}>
                        {rate >= 80 ? 'Excellent' : rate >= 60 ? 'Good' : 'Needs review'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
