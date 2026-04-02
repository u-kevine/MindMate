import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [conversations, setConversations] = useState([])
  const [activeConv,    setActiveConv]    = useState(null)
  const [messages,      setMessages]      = useState([])
  const [newMsg,        setNewMsg]        = useState('')
  const [sending,       setSending]       = useState(false)
  const [loadingConvs,  setLoadingConvs]  = useState(true)
  const [showNewConv,   setShowNewConv]   = useState(false)
  const [counselors,    setCounselors]    = useState([])
  const [newConvMsg,    setNewConvMsg]    = useState('')
  const [newConvTarget, setNewConvTarget] = useState(null)
  const bottomRef = useRef(null)
  const pollRef   = useRef(null)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations/')
      setConversations(res.data.results || res.data)
      setLoadingConvs(false)
    } catch {
      setLoadingConvs(false)
    }
  }, [])

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return
    try {
      const res = await api.get(`/messages/conversations/${convId}/messages/`)
      setMessages(res.data.results || res.data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      console.error('fetchMessages error', err)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (activeConv) {
      fetchMessages(activeConv.id)
      pollRef.current = setInterval(() => {
        fetchMessages(activeConv.id)
        fetchConversations()
      }, 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeConv, fetchMessages, fetchConversations])

  function openConversation(conv) {
    setActiveConv(conv)
    setMessages([])
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeConv) return
    setSending(true)
    const text = newMsg.trim()
    setNewMsg('')
    try {
      await api.post('/messages/send/', {
        conversation_id: activeConv.id,
        content: text,
      })
      await fetchMessages(activeConv.id)
      await fetchConversations()
    } catch {
      toast.error('Failed to send message')
      setNewMsg(text)
    } finally {
      setSending(false)
    }
  }

  async function startNewConversation() {
    if (!newConvTarget || !newConvMsg.trim()) return
    try {
      const res = await api.post('/messages/conversations/start/', {
        recipient_id: newConvTarget.id,
        initial_message: newConvMsg.trim(),
      })
      setShowNewConv(false)
      setNewConvMsg('')
      setNewConvTarget(null)
      await fetchConversations()
      setActiveConv(res.data)
      toast.success('Conversation started!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not start conversation')
    }
  }

  async function loadCounselors() {
    try {
      const res = await api.get('/auth/counselors/')
      setCounselors(res.data.results || res.data)
    } catch {}
  }

  function getOther(conv) {
    if (!conv) return null
    return (conv.participants || conv.participants_data || []).find(p => p.id !== user.id)
  }

  function formatTime(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    const isToday = d.toDateString() === new Date().toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const sb = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const cb = dark ? 'bg-gray-900' : 'bg-gray-50'
  const ib = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const inp = `w-full px-3 py-2 rounded-xl border text-sm outline-none focus:border-green-400 resize-none ${dark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800'}`

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Sidebar */}
      <div className={`w-72 flex-shrink-0 border-r flex flex-col ${sb}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className={`font-display font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Messages</h2>
          {user.role === 'student' && (
            <button onClick={() => { setShowNewConv(true); loadCounselors() }}
              className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold hover:bg-green-700">
              +
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <p className="p-4 text-center text-gray-400 text-sm">Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No conversations yet</p>
              {user.role === 'student' && (
                <button onClick={() => { setShowNewConv(true); loadCounselors() }}
                  className="mt-3 text-green-500 text-xs font-semibold hover:underline">
                  Start a conversation
                </button>
              )}
            </div>
          ) : conversations.map(conv => {
            const other = getOther(conv)
            const isActive = activeConv?.id === conv.id
            return (
              <button key={conv.id} onClick={() => openConversation(conv)}
                className={`w-full text-left p-4 border-b transition-colors ${
                  isActive
                    ? dark ? 'bg-gray-700 border-l-4 border-l-green-500 border-b-gray-600' : 'bg-green-50 border-l-4 border-l-green-500 border-b-gray-100'
                    : dark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(other?.full_name || other?.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold truncate ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                        {other?.full_name || other?.email || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400 ml-1 flex-shrink-0">
                        {formatTime(conv.last_message_data?.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {conv.last_message_data?.content || 'No messages yet'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="ml-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${cb}`}>
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">💬</div>
            <p className={`font-display text-xl ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Select a conversation</p>
            <p className={`text-sm mt-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Choose from the left or start a new one</p>
          </div>
        ) : (
          <>
            {/* Header */}
            {(() => {
              const other = getOther(activeConv)
              return (
                <div className={`px-5 py-3 border-b flex items-center gap-3 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {(other?.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={`font-semibold text-sm ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                      {other?.full_name || other?.email}
                    </div>
                    <div className="text-xs text-green-500">
                      {other?.role === 'counselor' ? '🧑‍⚕️ Counselor' : '🎓 Student'}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-12">No messages yet. Say hello!</p>
              ) : messages.map(msg => {
                const isMine = (msg.sender?.id ?? msg.sender) === user.id
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end">
                        {(msg.sender_name || msg.sender?.full_name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-green-600 text-white rounded-br-sm'
                        : dark ? 'bg-gray-700 text-gray-100 rounded-bl-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-green-200' : 'text-gray-400'}`}>
                        {formatTime(msg.created_at)}
                        {isMine && msg.is_read && <span className="ml-1">✓✓</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className={`px-4 py-3 border-t flex gap-3 items-end ${ib}`}>
              <textarea
                rows={1}
                className={`flex-1 px-4 py-2.5 rounded-2xl border text-sm resize-none outline-none focus:border-green-400 transition-all ${
                  dark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                }`}
                placeholder="Type a message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              />
              <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
                className="w-10 h-10 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all">
                {sending ? '…' : '➤'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConv && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl ${dark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-display font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>New Conversation</h3>
              <button onClick={() => setShowNewConv(false)} className="text-2xl text-gray-400 hover:text-gray-600 leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Select Counselor</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {counselors.length === 0 ? (
                    <p className="text-sm text-gray-400">Loading counselors...</p>
                  ) : counselors.map(c => (
                    <button key={c.id} onClick={() => setNewConvTarget(c)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        newConvTarget?.id === c.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : dark ? 'border-gray-600 bg-gray-700 hover:border-green-500' : 'border-gray-200 hover:border-green-400'
                      }`}>
                      <div className={`font-semibold text-sm ${dark ? 'text-gray-100' : 'text-gray-800'}`}>{c.full_name || c.email}</div>
                      <div className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{c.counselor_profile?.specialty || 'General Counseling'}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>First Message</label>
                <textarea rows={3} className={inp}
                  placeholder="Hi, I would like to discuss..."
                  value={newConvMsg} onChange={e => setNewConvMsg(e.target.value)} />
              </div>
            </div>
            <div className={`flex gap-3 p-5 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setShowNewConv(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${dark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
                Cancel
              </button>
              <button onClick={startNewConversation} disabled={!newConvTarget || !newConvMsg.trim()}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold">
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
