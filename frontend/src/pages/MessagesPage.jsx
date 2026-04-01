import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { messagesApi, authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 480, padding: 28, borderRadius: 20 }}>
        {title && <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 4 }}>{title}</h2>}
        {subtitle && <p style={{ fontSize: 13, color: '#A0AEC0', marginBottom: 20 }}>{subtitle}</p>}
        {children}
        {footer && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #EDF2F7' }}>{footer}</div>}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const { user }  = useAuth()
  const { t, theme } = useTheme()
  const qc        = useQueryClient()
  const [activeConvId, setActiveConvId] = useState(null)
  const [text, setText]                 = useState('')
  const [showNew, setShowNew]           = useState(false)
  const [newRecipient, setNewRecipient] = useState('')
  const [newMsg, setNewMsg]             = useState('')
  const bottomRef = useRef(null)
  const dark = theme === 'dark'

  const { data: convData, isLoading: convLoading } = useQuery(
    'conversations',
    () => messagesApi.conversations().then(r => r.data)
  )
  const conversations = convData?.results || convData || []

  const { data: messagesData, isLoading: msgsLoading } = useQuery(
    ['messages', activeConvId],
    () => messagesApi.messages(activeConvId).then(r => r.data),
    { enabled: !!activeConvId, refetchInterval: 8000 }
  )
  const msgs = messagesData?.results || messagesData || []

  const { data: counselors } = useQuery(
    'counselors',
    () => authApi.counselors().then(r => r.data),
    { enabled: user?.role === 'student' }
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const sendMutation = useMutation(
    data => messagesApi.send(data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['messages', activeConvId])
        qc.invalidateQueries('conversations')
        qc.invalidateQueries('unread-count')
        setText('')
      },
      onError: () => toast.error('Failed to send message.'),
    }
  )

  const startConvMutation = useMutation(
    data => messagesApi.startConversation(data),
    {
      onSuccess: ({ data: conv }) => {
        qc.invalidateQueries('conversations')
        setActiveConvId(conv.id)
        setShowNew(false)
        setNewRecipient('')
        setNewMsg('')
        toast.success('Conversation started!')
      },
    }
  )

  const handleSend = () => {
    if (!text.trim() || !activeConvId) return
    sendMutation.mutate({ conversation_id: activeConvId, content: text.trim() })
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const activeConv = conversations.find(c => c.id === activeConvId)
  const otherParticipant = activeConv?.participants_data?.find(p => p.id !== user?.id)

  const borderColor = dark ? '#3A4E3E' : '#EDF2F7'
  const cardBg = dark ? '#2A3830' : '#ffffff'
  const threadBg = dark ? '#172018' : '#FAF7F2'
  const textPrimary = dark ? '#F0EDE6' : '#2D3748'
  const textMuted = dark ? '#7A9070' : '#A0AEC0'

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
            Messages
          </h1>
          <p style={{ fontSize: 13, color: textMuted }}>Secure and confidential communications</p>
        </div>
        <button className="btn btn-terra btn-sm" onClick={() => setShowNew(true)}>
          + New Conversation
        </button>
      </div>

      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr',
        border: `1px solid ${borderColor}`, borderRadius: 16, overflow: 'hidden',
        background: cardBg, minHeight: 0
      }}>
        <div style={{ borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${borderColor}`, background: dark ? '#243028' : '#EBF3EC' }}>
            <input className="form-input" placeholder="Search…" style={{ fontSize: 12, padding: '7px 10px' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {convLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: textMuted }}>Loading…</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: textMuted, fontSize: 13 }}>No conversations yet</div>
            ) : (
              conversations.map(conv => {
                const other = conv.participants_data?.find(p => p.id !== user?.id)
                const last = conv.last_message_data
                const isActive = conv.id === activeConvId
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: `1px solid ${borderColor}`,
                      cursor: 'pointer',
                      background: isActive ? (dark ? '#2E4035' : '#EBF3EC') : 'transparent',
                      borderLeft: isActive ? '3px solid #6B8F71' : '3px solid transparent',
                      transition: 'background .12s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: '#6B8F71',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0
                      }}>
                        {other?.initials || 'MM'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {other?.full_name}
                        </div>
                        <div style={{ fontSize: 11, color: textMuted, textTransform: 'capitalize' }}>{other?.role}</div>
                      </div>
                      {conv.unread_count > 0 && (
                        <span style={{ background: '#C2714F', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {last && (
                      <div style={{ fontSize: 11, color: textMuted, paddingLeft: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {last.content}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {activeConvId ? (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${borderColor}`, background: dark ? '#243028' : '#EBF3EC', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6B8F71', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                {otherParticipant?.initials || 'MM'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: textPrimary }}>{otherParticipant?.full_name}</div>
                <div style={{ fontSize: 11, color: '#6B8F71' }}>● Online · Case linked</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, background: threadBg }}>
              {msgsLoading ? (
                <div style={{ textAlign: 'center', color: textMuted, padding: 40 }}>Loading messages…</div>
              ) : msgs.length === 0 ? (
                <div style={{ textAlign: 'center', color: textMuted, padding: 40, fontSize: 13 }}>No messages yet. Start the conversation!</div>
              ) : (
                msgs.map(msg => {
                  const isMine = msg.sender === user?.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: isMine ? '#6B8F71' : (dark ? '#2E4035' : '#EBF3EC'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: isMine ? '#fff' : '#6B8F71'
                      }}>
                        {msg.sender_initials || 'MM'}
                      </div>
                      <div>
                        <div style={{
                          maxWidth: 320, padding: '9px 13px', borderRadius: 14, fontSize: 13, lineHeight: 1.55,
                          background: isMine ? '#6B8F71' : (dark ? '#2A3830' : '#ffffff'),
                          color: isMine ? '#fff' : textPrimary,
                          border: isMine ? 'none' : `1px solid ${borderColor}`,
                          borderBottomRightRadius: isMine ? 3 : 14,
                          borderBottomLeftRadius: isMine ? 14 : 3,
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: 10, color: textMuted, marginTop: 3, textAlign: isMine ? 'right' : 'left' }}>
                          {new Date(msg.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                          {msg.is_read && isMine && ' ✓✓'}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '12px 16px', borderTop: `1px solid ${borderColor}`, display: 'flex', gap: 10, alignItems: 'flex-end', background: cardBg, flexShrink: 0 }}>
              <textarea
                className="form-input"
                style={{ flex: 1, resize: 'none', minHeight: 40, maxHeight: 120, borderRadius: 20, padding: '10px 16px', fontSize: 13 }}
                placeholder="Type a message…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sendMutation.isLoading}
                style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#6B8F71',
                  color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, opacity: !text.trim() ? 0.5 : 1, transition: 'opacity .2s'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <div style={{ textAlign: 'center', color: textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>💬</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Choose a conversation</div>
              <p style={{ fontSize: 13 }}>Select one or start a new conversation.</p>
            </div>
          </div>
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)}
        title="New Conversation" subtitle="Start a secure discussion"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={!newRecipient || !newMsg.trim() || startConvMutation.isLoading}
              onClick={() => startConvMutation.mutate({ recipient_id: Number(newRecipient), initial_message: newMsg })}
            >
              {startConvMutation.isLoading ? '⏳' : 'Start Conversation'}
            </button>
          </>
        }
      >
        <div>
          <div className="form-group">
            <label className="form-label">Recipient</label>
            <select className="form-input" value={newRecipient} onChange={e => setNewRecipient(e.target.value)}>
              <option value="">Choose a counselor…</option>
              {(counselors || []).map(c => (
                <option key={c.id} value={c.id}>
                  {c.full_name}{c.specialty ? ` — ${c.specialty}` : ''}{!c.is_available ? ' (unavailable)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Message</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Hello, I would like to discuss…"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
