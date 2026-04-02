import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-gray-100 text-gray-500',
}

export default function SessionsPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [sessions,     setSessions]     = useState([])
  const [counselors,   setCounselors]   = useState([])
  const [slots,        setSlots]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking,      setBooking]      = useState(false)
  const [showModal,    setShowModal]    = useState(false)
  const [step,         setStep]         = useState(1)
  const [selCounselor, setSelCounselor] = useState(null)
  const [selSlot,      setSelSlot]      = useState(null)
  const [tab,          setTab]          = useState('upcoming')
  const [form, setForm] = useState({
    title: 'Counseling Session',
    notes: '',
    location: 'Online / Room TBD',
    duration_mins: 60,
  })

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    setLoading(true)
    try {
      const res = await api.get('/sessions/')
      setSessions(res.data.results || res.data)
    } catch {
      toast.error('Could not load sessions')
    } finally {
      setLoading(false)
    }
  }

  async function openBooking() {
    setStep(1)
    setSelCounselor(null)
    setSelSlot(null)
    setForm({ title: 'Counseling Session', notes: '', location: 'Online / Room TBD', duration_mins: 60 })
    setShowModal(true)
    try {
      const res = await api.get('/auth/counselors/')
      setCounselors(res.data.results || res.data)
    } catch {
      toast.error('Could not load counselors')
    }
  }

  async function pickCounselor(c) {
    setSelCounselor(c)
    setStep(2)
    setSlotsLoading(true)
    setSlots([])
    try {
      const res = await api.get(`/sessions/available-slots/?counselor_id=${c.id}`)
      setSlots(res.data.slots || [])
    } catch {
      toast.error('Could not load available slots')
    } finally {
      setSlotsLoading(false)
    }
  }

  async function confirmBooking() {
    if (!selCounselor || !selSlot) return
    setBooking(true)
    try {
      await api.post('/sessions/', {
        counselor:     selCounselor.id,
        scheduled_at:  selSlot.datetime,
        title:         form.title,
        notes:         form.notes,
        location:      form.location,
        duration_mins: form.duration_mins,
      })
      toast.success('Session booked! Confirmation email sent 📧')
      setShowModal(false)
      loadSessions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  async function changeStatus(id, newStatus) {
    try {
      await api.patch(`/sessions/${id}/status/`, { status: newStatus })
      toast.success(`Session ${newStatus}`)
      loadSessions()
    } catch {
      toast.error('Could not update session')
    }
  }

  const now       = new Date()
  const upcoming  = sessions.filter(s => new Date(s.scheduled_at) >= now && s.status !== 'cancelled')
  const past      = sessions.filter(s => new Date(s.scheduled_at) < now || s.status === 'completed')
  const cancelled = sessions.filter(s => s.status === 'cancelled')
  const shown     = tab === 'upcoming' ? upcoming : tab === 'past' ? past : cancelled

  const card     = `rounded-xl border p-5 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`
  const inp      = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-green-400 ${dark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200'}`
  const headText = dark ? 'text-gray-100' : 'text-gray-800'
  const subText  = dark ? 'text-gray-400' : 'text-gray-500'
  const modalBg  = dark ? 'bg-gray-800' : 'bg-white'
  const divider  = dark ? 'border-gray-700' : 'border-gray-200'

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`font-display text-2xl font-semibold ${headText}`}>
            Counseling Sessions
          </h1>
          <p className={`text-sm mt-1 ${subText}`}>
            Book and manage your counseling sessions
          </p>
        </div>
        {user.role === 'student' && (
          <button onClick={openBooking}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all">
            + Book a Session
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Upcoming',  value: upcoming.length,  color: 'text-green-500' },
          { label: 'Completed', value: past.length,      color: 'text-blue-500'  },
          { label: 'Cancelled', value: cancelled.length, color: 'text-red-400'   },
        ].map(s => (
          <div key={s.label} className={card}>
            <div className={`text-3xl font-display font-semibold ${s.color}`}>{s.value}</div>
            <div className={`text-xs uppercase tracking-wide mt-1 ${subText}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        {['upcoming', 'past', 'cancelled'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-green-600 text-white' : `${subText} hover:text-green-500`
            }`}>
            {t} ({t === 'upcoming' ? upcoming.length : t === 'past' ? past.length : cancelled.length})
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className={`text-center py-12 ${subText}`}>Loading sessions…</div>
      ) : shown.length === 0 ? (
        <div className={`${card} text-center py-16`}>
          <div className="text-5xl mb-4">📅</div>
          <p className={`font-display text-lg ${headText}`}>No {tab} sessions</p>
          {tab === 'upcoming' && user.role === 'student' && (
            <button onClick={openBooking}
              className="mt-4 text-green-500 text-sm font-semibold hover:underline">
              Book your first session →
            </button>
          )}
        </div>
      ) : shown.map(s => {
        const dt    = new Date(s.scheduled_at)
        const other = user.role === 'student' ? s.counselor : s.student
        return (
          <div key={s.id} className={`${card} flex items-start gap-4 mb-4`}>
            <div className={`flex-shrink-0 w-14 text-center rounded-xl py-2 ${dark ? 'bg-gray-700' : 'bg-green-50'}`}>
              <div className="text-xs font-bold text-green-600 uppercase">
                {dt.toLocaleString('default', { month: 'short' })}
              </div>
              <div className={`text-2xl font-display font-bold ${headText}`}>{dt.getDate()}</div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`font-semibold text-sm ${headText}`}>{s.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-500'}`}>
                  {s.status}
                </span>
              </div>
              <div className={`text-sm ${subText}`}>
                {user.role === 'student' ? '🧑‍⚕️' : '🎓'} {other?.full_name || other?.email || 'Unknown'}
                &nbsp;·&nbsp;
                {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                &nbsp;·&nbsp;{s.duration_mins} min
                &nbsp;·&nbsp;📍 {s.location || 'TBD'}
              </div>
              {s.meeting_link && (
                <a href={s.meeting_link} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-green-500 font-semibold hover:underline">
                  🔗 Join Meeting
                </a>
              )}
              {s.notes && <p className={`text-xs mt-1 ${subText}`}>{s.notes}</p>}
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              {s.status === 'pending' && user.role === 'counselor' && (
                <button onClick={() => changeStatus(s.id, 'confirmed')}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-semibold hover:bg-green-700">
                  Confirm ✓
                </button>
              )}
              {s.status === 'confirmed' && user.role === 'counselor' && (
                <button onClick={() => changeStatus(s.id, 'completed')}
                  className="px-3 py-1.5 bg-blue-100 text-blue-600 text-xs rounded-lg font-semibold hover:bg-blue-200">
                  Complete
                </button>
              )}
              {['pending', 'confirmed'].includes(s.status) && (
                <button onClick={() => changeStatus(s.id, 'cancelled')}
                  className="px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg font-semibold hover:bg-red-200">
                  Cancel
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${modalBg}`}>

            {/* Modal header */}
            <div className={`flex items-center justify-between p-5 border-b ${divider}`}>
              <div>
                <h2 className={`font-display text-lg font-semibold ${headText}`}>Book a Session</h2>
                <div className="flex items-center gap-1 mt-2">
                  {['Choose Counselor', 'Pick Time', 'Confirm'].map((label, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step > i + 1 ? 'bg-green-600 text-white' :
                        step === i + 1 ? 'bg-green-600 text-white' :
                        dark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step > i + 1 ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs ${subText}`}>{label}</span>
                      {i < 2 && <span className={`text-xs ${subText}`}> › </span>}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                className={`text-2xl leading-none ${subText} hover:text-red-400`}>×</button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">

              {/* Step 1 — Pick counselor */}
              {step === 1 && (
                <div className="space-y-3">
                  <p className={`text-sm ${subText} mb-3`}>Select a counselor:</p>
                  {counselors.length === 0 ? (
                    <p className={`text-sm ${subText}`}>Loading counselors…</p>
                  ) : counselors.map(c => (
                    <button key={c.id} onClick={() => pickCounselor(c)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-green-400 ${
                        dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {(c.full_name || c.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${headText}`}>{c.full_name || c.email}</div>
                          <div className={`text-xs ${subText}`}>
                            {c.counselor_profile?.specialty || 'General Counseling'}
                          </div>
                        </div>
                        <span className="text-green-500 text-lg">›</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 — Pick slot */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setStep(1)} className="text-green-500 text-sm hover:underline">← Back</button>
                    <span className={`text-sm ${subText}`}>
                      Slots for <strong className={headText}>{selCounselor?.full_name}</strong>
                    </span>
                  </div>
                  {slotsLoading ? (
                    <p className={`text-sm ${subText} text-center py-8`}>Loading available times…</p>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-8">
                      <p className={`text-sm ${subText}`}>No available slots in the next 14 days.</p>
                      <button onClick={() => setStep(1)} className="mt-3 text-green-500 text-sm hover:underline">
                        Try another counselor
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map(slot => (
                        <button key={slot.datetime}
                          onClick={() => { setSelSlot(slot); setStep(3) }}
                          className={`p-3 rounded-xl border-2 text-left transition-all hover:border-green-400 ${
                            dark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-200 bg-gray-50 hover:bg-green-50'
                          }`}>
                          <div className={`text-xs font-semibold ${headText}`}>{slot.label}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 — Confirm */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setStep(2)} className="text-green-500 text-sm hover:underline">← Back</button>
                  </div>

                  <div className={`rounded-xl p-4 mb-5 ${dark ? 'bg-gray-700' : 'bg-green-50'}`}>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={subText}>Counselor</span>
                        <span className={`font-semibold ${headText}`}>{selCounselor?.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={subText}>Date & Time</span>
                        <span className={`font-semibold ${headText}`}>{selSlot?.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${subText}`}>Session Title</label>
                      <input className={inp} value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${subText}`}>Location</label>
                      <input className={inp} value={form.location}
                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${subText}`}>Duration</label>
                      <select className={inp} value={form.duration_mins}
                        onChange={e => setForm(f => ({ ...f, duration_mins: parseInt(e.target.value) }))}>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${subText}`}>Notes (optional)</label>
                      <textarea className={inp} rows={3}
                        placeholder="What would you like to discuss?"
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                    <p className={`text-xs ${subText}`}>
                      📧 A confirmation email will be sent to you and your counselor.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex gap-3 p-5 border-t ${divider}`}>
              <button onClick={() => setShowModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${
                  dark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'
                }`}>
                Cancel
              </button>
              {step === 3 && (
                <button onClick={confirmBooking} disabled={booking}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
                  {booking ? 'Booking…' : 'Confirm Booking ✓'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
