import { useState } from 'react'
import { useQuery } from 'react-query'
import { resourcesApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

export default function ResourcesPage() {
  const { user }  = useAuth()
  const { t }     = useTheme()
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch]       = useState('')

  const { data: categories } = useQuery(
    'categories',
    () => resourcesApi.categories().then(r => r.data)
  )
  const { data, isLoading } = useQuery(
    ['resources', catFilter],
    () => resourcesApi.list({ category: catFilter || undefined }).then(r => r.data)
  )

  const cats = categories?.results || categories || []
  const resources = (data?.results || data || []).filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
            Wellness Resources
          </h1>
          <p style={{ fontSize: 13, color: '#A0AEC0' }}>Mental health educational materials</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-terra btn-sm" onClick={() => toast('Upload resource feature active')}>
            + Upload Resource
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setCatFilter('')}
          className={`btn btn-sm ${!catFilter ? 'btn-primary' : 'btn-outline'}`}
        >
          {t('all')}
        </button>
        {cats.map(c => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            className={`btn btn-sm ${catFilter == c.id ? 'btn-primary' : 'btn-outline'}`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search resources…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A0AEC0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <div>Loading resources…</div>
        </div>
      ) : resources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A0AEC0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No resources found</div>
          <p style={{ fontSize: 14 }}>Check back soon for new wellness materials.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {resources.map(r => (
            <div
              key={r.id}
              className="card"
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }}
              onClick={() => toast(`Opening: "${r.title}"`)}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{
                height: 110,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 46,
                background: r.category_color || '#EBF3EC'
              }}>
                {r.category_icon || '📄'}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#A0AEC0', marginBottom: 6 }}>
                  {r.category_name}
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 600, marginBottom: 8, lineHeight: 1.35 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5, marginBottom: 8 }}>
                  {r.description}
                </div>
              </div>
              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid #EDF2F7',
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, color: '#A0AEC0'
              }}>
                <span>👁 {r.view_count} {t('views')}</span>
                <span>🕐 {r.read_time_minutes} {t('min_read')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
