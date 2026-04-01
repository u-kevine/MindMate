import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { casesApi, authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

const CASE_TYPES = [
  { value: 'academic',     label: 'Academic Stress' },
  { value: 'anxiety',      label: 'Anxiety' },
  { value: 'grief',        label: 'Grief & Loss' },
  { value: 'relationship', label: 'Relationships' },
  { value: 'depression',   label: 'Depression' },
  { value: 'trauma',       label: 'Trauma' },
  { value: 'other',        label: 'Other' },
]

const PRIORITIES = [
  { value: 'low',    label: 'Low — general wellness' },
  { value: 'medium', label: 'Medium — affecting daily life' },
  { value: 'high',   label: 'High — need urgent help' },
  { value: 'urgent', label: 'Urgent — immediate crisis' },
]

function StatusBadge({ status }) {
  const map = { open: 'badge-open', in_progress: 'badge-progress', resolved: 'badge-resolved', closed: 'badge-resolved' }
  const labels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }
  return <span className={`badge ${map[status] || 'badge-open'}`}>{labels[status] || status}</span>
}

function PriorityBadge({ priority }) {
  const map = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent' }
  const labels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
  return <span className={`badge ${map[priority] || 'badge-medium'}`}>{labels[priority] || priority}</span>
}

function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 520, padding: 28, borderRadius: 20 }}>
        {title && <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 4 }}>{title}</h2>}
        {subtitle && <p style={{ fontSize: 13, color: '#A0AEC0', marginBottom: 20 }}>{subtitle}</p>}
        {children}
        {footer && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #EDF2F7' }}>{footer}</div>}
      </div>
    </div>
  )
}

export default function CasesPage() {
  const { user }    = useAuth()
  const { t }       = useTheme()
  const qc          = useQueryClient()
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery(
    ['cases', statusFilter],
    () => casesApi.list({ status: statusFilter || undefined }).then(r => r.data)
  )

  const { data: counselors } = useQuery(
    'counselors',
    () => authApi.counselors().then(r => r.data),
    { enabled: user?.role === 'student' }
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const createMutation = useMutation(
    data => casesApi.create(data),
    {
      onSuccess: () => {
        qc.invalidateQueries('cases')
        qc.invalidateQueries('dashboard-stats')
        toast.success('Request submitted! A counselor will respond within 24 hours. 🌿')
        setShowCreate(false)
        reset()
      },
      onError: err => toast.error(err.response?.data?.detail || 'Error submitting request.'),
    }
  )

  const cases = (data?.results || []).filter(c =>
    !search ||
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.student_name?.toLowerCase().includes(search.toLowerCase())
  )

  const isStudent = user?.role === 'student'

  const statusFilters = [
    { value: '', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
  ]

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
            {isStudent ? 'My Support Requests' : 'Support Cases'}
          </h1>
          <p style={{ fontSize: 13, color: '#A0AEC0' }}>
            {isStudent ? 'Track your support journey' : 'Manage all student cases'}
          </p>
        </div>
        {isStudent && (
          <button className="btn btn-terra" onClick={() => setShowCreate(true)}>
            + New Request
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ maxWidth: 220 }}
          placeholder="Search cases…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {statusFilters.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`btn btn-sm ${statusFilter === s.value ? 'btn-primary' : 'btn-outline'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A0AEC0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div>Loading cases…</div>
        </div>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A0AEC0' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📋</div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No cases found</div>
          <p style={{ fontSize: 14, marginBottom: 20 }}>
            {isStudent ? 'Submit a support request to get started.' : 'No cases match your filters.'}
          </p>
          {isStudent && (
            <button className="btn btn-terra" onClick={() => setShowCreate(true)}>+ New Request</button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  {!isStudent && <th>Student</th>}
                  <th>Title</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Progress</th>
                  {!isStudent && <th>Counselor</th>}
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: '#6B8F71', fontFamily: 'monospace' }}>{c.case_number}</td>
                    {!isStudent && <td style={{ fontWeight: 600 }}>{c.student_name}</td>}
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                    <td style={{ fontSize: 12, color: '#A0AEC0', textTransform: 'capitalize' }}>{c.case_type}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ width: 100 }}>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: c.progress_percent + '%' }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#A0AEC0', marginTop: 2 }}>{c.progress_percent}%</div>
                    </td>
                    {!isStudent && <td style={{ fontSize: 12, color: '#718096' }}>{c.counselor_name || '—'}</td>}
                    <td style={{ fontSize: 12, color: '#A0AEC0', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString('en')}
                    </td>
                    <td>
                      <Link to={`/cases/${c.id}`} className="btn btn-outline btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Support Request"
        subtitle="Your request is completely confidential 🔒"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button
              className="btn btn-terra"
              form="create-case-form"
              type="submit"
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? '⏳ Submitting…' : 'Submit Request'}
            </button>
          </>
        }
      >
        <form id="create-case-form" onSubmit={handleSubmit(d => createMutation.mutate(d))}>
          <div className="form-group">
            <label className="form-label">Title / Subject</label>
            <input
              className="form-input"
              placeholder="Briefly describe your situation…"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Type of Support</label>
              <select className="form-input" {...register('case_type', { required: true })}>
                {CASE_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select className="form-input" {...register('priority')}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">How are you feeling?</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Share what you are experiencing. This is a safe and confidential space…"
              {...register('description', { required: 'Please describe how you are feeling' })}
            />
            {errors.description && <p className="form-error">{errors.description.message}</p>}
          </div>

          {counselors?.length > 0 && (
            <div className="form-group">
              <label className="form-label">Preferred Counselor (optional)</label>
              <select className="form-input" {...register('counselor')}>
                <option value="">No preference</option>
                {counselors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}{c.specialty ? ` — ${c.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, background: '#FAF7F2' }}>
            <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#6B8F71' }} {...register('is_urgent')} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Mark as urgent</div>
              <div style={{ fontSize: 11, color: '#A0AEC0' }}>If you need immediate support</div>
            </div>
          </label>
        </form>
      </Modal>
    </div>
  )
}
