import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import api from '../services/api'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-600',
}

export default function SessionsPage() {
  const { user } = useAuth()
  const { t, theme } = useTheme()
  const dark = theme === 'dark'

  const [sessions, setSessions]       = useState([])
  const [counselors, setCounselors]   = useState([])
  const [slots, setSlots]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [showBook, setShowBook]       = useState(false)
  const [step, setStep]               = useState(1) // 1=pick counselor, 2=pick slot, 3=confirm
  const [selectedCounselor, setSelectedCounselor] = useState(null)
  const [selectedSlot, setSelectedSlot]           = useState(null)
  const [form, setForm] = useState({ title: 'Counseling Session', notes: '', location: 'Online / Room TBD', duration_mins: 60 })
  const [booking, setBooking] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => { fetchSessions() }, [])

  async function fetchSessions() {
    setLoading(true)
    try {
      const res = await api.get('/sessions/')
      setSessions(res.data.results || res.data)
    } catch { toast.error('Could not load sessions') }
    finally { setLoading(false) }
  }

  async function fetchCounselors() {
    try {
      const res = await api.get('/auth/counselors/')
      setCounselors(res.data.results || res.data)
    } catch { toast.error('Could not load counselors') }
  }

  async function fetchSlots(counselorId) {
    try {
      const res = await api.get(`/sessions/available-slots/?counselor_id=${counselorId}`)
      setSlots(res.data.slots || [])
    } catch { toast.error('Could not load available slots') }
  }

  function openBooking() {
    setStep(1)
    setSelectedCounselor(null)
    setSelectedSlot(null)
    setForm({ title: 'Counseling Session', notes: '', location: 'Online / Room TBD', duration_mins: 60 })
    setShowBook(true)
    fetchCounselors()
  }

  async function pickCounselor(c) {
    setSelectedCounselor(c)
    setStep(2)
    await fetchSlots(c.id)
  }

  function pickSlot(slot) {
    setSelectedSlot(slot)
    setStep(3)
  }

  async function submitBooking() {
    if (!selectedCounselor || !selectedSlot) return
    setBooking(true)
    try {
      await api.post('/sessions/', {
        counselor: selectedCounselor.id,
        scheduled_at: selectedSlot.datetime,
        title: form.title,
        notes: form.notes,
        location: form.location,
        duration_mins: form.duration_mins,
      })
      toast.success('Session booked! Confirmation email sent 📧')
      setShowBook(false)
      fetchSessions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  async function updateStatus(sessionId, status) {
    try {
      await api.patch(`/sessions/${sessionId}/status/`, { status })
      toast.success(`Session ${status}`)
      fetchSessions()
    } catch { toast.error('Could not update session') }
  }

  const now = new Date()
  const upcoming  = sessions.filter(s => new Date(s.scheduled_at) >= now && s.status !== 'cancelled')
  const past      = sessions.filter(s => new Date(s.scheduled_at) < now || s.status === 'completed')
  const cancelled = sessions.filter(s => s.status === 'cancelled')
  const displayed = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled

  const card = `rounded-xl border p-5 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
  const input = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-green-400 ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`font-display text-2xl font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
            Counseling Sessions
          </h1>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Book, manage and track your sessions
          </p>
        </div>
        {user.role === 'student' && (
          <button onClick={openBooking}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
            + Book Session
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Upcoming', value: upcoming.length,  color: 'text-green-500' },
          { label: 'Completed', value: past.length,     color: 'text-blue-500' },
          { label: 'Cancelled', value: cancelled.length, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className={card}>
            <div className={`text-3xl font-display font-semibold ${s.color}`}>{s.value}</div>
            <div className={`text-xs uppercase tracking-wide mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {['upcoming', 'past', 'cancelled'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab} ({tab === 'upcoming' ? upcoming.length : tab === 'past' ? past.length : cancelled.length})
          </button>
        ))}
      </div>

      {/* Session list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading sessions…</div>
      ) : displayed.length === 0 ? (
        <div className={`${card} text-center py-16`}>
          <div className="text-5xl mb-4">📅</div>
          <p className={`font-display text-lg ${dark ? 'text-gray-300' : 'text-gray-600'}`}>No {activeTab} sessions</p>
          {activeTab === 'upcoming' && user.role === 'student' && (
            <button onClick={openBooking} className="mt-4 text-green-500 text-sm font-semibold hover:underline">
              Book your first session →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(session => {
            const dt = new Date(session.scheduled_at)
            const other = user.role === 'student' ? session.counselor : session.student
            return (
              <div key={session.id} className={`${card} flex items-start gap-4`}>
                {/* Date block */}
                <div className={`flex-shrink-0 w-16 text-center rounded-xl py-2 ${dark ? 'bg-gray-700' : 'bg-green-50'}`}>
                  <div className="text-xs font-bold text-green-600 uppercase">
                    {dt.toLocaleString('default', { month: 'short' })}
                  </div>
                  <div className={`text-2xl font-display font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                    {dt.getDate()}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                      {session.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[session.status]}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.role === 'student' ? '🧑‍⚕️' : '🎓'} {other?.full_name || other?.email}
                    &nbsp;·&nbsp;
                    {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    &nbsp;·&nbsp;
                    {session.duration_mins} min
                    &nbsp;·&nbsp;
                    📍 {session.location || 'TBD'}
                  </div>
                  {session.meeting_link && (
                    <a href={session.meeting_link} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-green-500 hover:underline font-semibold">
                      🔗 Join Meeting
                    </a>
                  )}
                  {session.notes && (
                    <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {session.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {session.status === 'pending' && user.role === 'counselor' && (
                    <button onClick={() => updateStatus(session.id, 'confirmed')}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-semibold hover:bg-green-700">
                      Confirm
                    </button>
                  )}
                  {['pending', 'confirmed'].includes(session.status) && (
                    <button onClick={() => updateStatus(session.id, 'cancelled')}
                      className="px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg font-semibold hover:bg-red-200">
                      Cancel
                    </button>
                  )}
                  {session.status === 'confirmed' && user.role === 'counselor' && (
                    <button onClick={() => updateStatus(session.id, 'completed')}
                      className="px-3 py-1.5 bg-blue-100 text-blue-600 text-xs rounded-lg font-semibold hover:bg-blue-200">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Booking Modal ── */}
      {showBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${dark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className={`font-display text-xl font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                  Book a Session
                </h2>
                <div className="flex gap-2 mt-2">
                  {['Pick Counselor', 'Pick Time', 'Confirm'].map((s, i) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step > i + 1 ? 'bg-green-600 text-white' :
                        step === i + 1 ? 'bg-green-600 text-white' :
                        dark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                      }`}>{step > i + 1 ? '✓' : i + 1}</div>
                      <span className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s}</span>
                      {i < 2 && <span className="text-gray-300 text-xs">›</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowBook(false)}
                className={`text-2xl leading-none ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                ×
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">

              {/* Step 1: Pick counselor */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className={`text-sm mb-4 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Choose a counselor for your session:
                  </p>
                  {counselors.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">Loading counselors…</div>
                  ) : counselors.map(c => (
                    <button key={c.id} onClick={() => pickCounselor(c)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-green-400 ${
                        dark ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-green-50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {(c.full_name || c.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-semibold text-sm ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                            {c.full_name || c.email}
                          </div>
                          <div className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {c.counselor_profile?.specialty || 'General Counseling'}
                            {c.counselor_profile?.is_available === false && (
                              <span className="ml-2 text-red-400">· Currently unavailable</span>
                            )}
                          </div>
                        </div>
                        <span className="ml-auto text-green-500 text-lg">›</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Pick time slot */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setStep(1)} className="text-green-500 text-sm hover:underline">← Back</button>
                    <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Available slots for <strong>{selectedCounselor?.full_name}</strong>
                    </span>
                  </div>
                  {slots.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No available slots in the next 14 days</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map(slot => (
                        <button key={slot.datetime} onClick={() => pickSlot(slot)}
                          className={`p-3 rounded-xl border-2 text-left transition-all hover:border-green-400 ${
                            selectedSlot?.datetime === slot.datetime
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : dark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                          }`}>
                          <div className={`text-xs font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                            {slot.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setStep(2)} className="text-green-500 text-sm hover:underline">← Back</button>
                  </div>

                  {/* Summary */}
                  <div className={`rounded-xl p-4 mb-5 ${dark ? 'bg-gray-700' : 'bg-green-50'}`}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={dark ? 'text-gray-400' : 'text-gray-500'}>Counselor</span>
                        <span className={`font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{selectedCounselor?.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={dark ? 'text-gray-400' : 'text-gray-500'}>Date & Time</span>
                        <span className={`font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{selectedSlot?.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Session Title</label>
                      <input className={input} value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Location</label>
                      <input className={input} value={form.location}
                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</label>
                      <select className={input} value={form.duration_mins}
                        onChange={e => setForm(f => ({ ...f, duration_mins: parseInt(e.target.value) }))}>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Notes (optional)</label>
                      <textarea className={input} rows={3} placeholder="What would you like to discuss?"
                        value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                  </div>

                  <p className={`text-xs mt-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    📧 A confirmation email will be sent to you and your counselor.<br/>
                    📅 A Google Calendar invite will be created automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowBook(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${
                  dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                Cancel
              </button>
              {step === 3 && (
                <button onClick={submitBooking} disabled={booking}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {booking ? 'Booking…' : 'Confirm Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
