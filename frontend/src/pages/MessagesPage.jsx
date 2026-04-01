import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { messagesApi, authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { PageHeader, PageLoader, EmptyState, Modal } from '../components/common/index.jsx'
import { Send } from 'lucide-react'

function ConversationItem({ conv, active, onClick }) {
  const { user } = useAuth()
  const other = conv.participants_data?.find(p => p.id !== user?.id)
  const last  = conv.last_message_data

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-colors
        ${active
          ? 'bg-sage-50 dark:bg-sage-900/20 border-l-4 border-sage-400'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-sage-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {other?.initials || 'MM'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{other?.full_name}</div>
          <div className="text-xs text-gray-400 capitalize">{other?.role}</div>
        </div>
        {conv.unread_count > 0 && (
          <span className="bg-terra-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {conv.unread_count}
          </span>
        )}
      </div>
      {last && (
        <div className="text-xs text-gray-400 truncate pl-10">
          {last.sender === user?.full_name ? 'Vous : ' : ''}{last.content}
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg, isMine }) {
  return (
    <div className={`flex gap-2 items-end ${isMine ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
        ${isMine ? 'bg-sage-400 text-white' : 'bg-sage-50 text-sage-500 dark:bg-sage-900/30'}`}>
        {msg.sender_initials || 'MM'}
      </div>
      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
        ${isMine
          ? 'bg-sage-400 text-white rounded-br-sm'
          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-bl-sm'}`}>
        {msg.content}
        <div className={`text-[10px] mt-1 ${isMine ? 'text-sage-100' : 'text-gray-400'}`}>
          {new Date(msg.created_at).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}
          {msg.is_read && isMine && ' ✓✓'}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const { user }  = useAuth()
  const { t }     = useTheme()
  const qc        = useQueryClient()
  const [activeConvId, setActiveConvId] = useState(null)
  const [text, setText]                 = useState('')
  const [showNew, setShowNew]           = useState(false)
  const [newRecipient, setNewRecipient] = useState('')
  const [newMsg, setNewMsg]             = useState('')
  const bottomRef                       = useRef(null)

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
      onError: () => toast.error('Erreur lors de l\'envoi.'),
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
        toast.success('Conversation démarrée !')
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

  return (
    <div className="animate-fade-in h-[calc(100vh-120px)] flex flex-col">
      <PageHeader
        title={t('messages')}
        subtitle="Communications sécurisées et confidentielles"
        actions={
          <button className="btn btn-terra btn-sm" onClick={() => setShowNew(true)}>
            + Nouvelle conversation
          </button>
        }
      />

      <div className="flex flex-1 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 border-r border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-sage-50 dark:bg-sage-900/20">
            <input className="form-input text-sm" placeholder="Rechercher…" />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {convLoading ? (
              <div className="p-8 flex justify-center"><PageLoader /></div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">Aucune conversation</div>
            ) : (
              conversations.map(conv => (
                <ConversationItem key={conv.id} conv={conv}
                  active={conv.id === activeConvId}
                  onClick={() => setActiveConvId(conv.id)} />
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        {activeConvId ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Thread header */}
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700
                            bg-sage-50 dark:bg-sage-900/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sage-400 flex items-center justify-center text-white text-sm font-bold">
                {otherParticipant?.initials || 'MM'}
              </div>
              <div>
                <div className="font-bold text-gray-800 dark:text-gray-100">{otherParticipant?.full_name}</div>
                <div className="text-xs text-sage-500">● En ligne · {activeConv?.case ? `Dossier lié` : 'Discussion générale'}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
              {msgsLoading ? (
                <div className="flex justify-center py-10"><PageLoader /></div>
              ) : msgs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  Aucun message. Commencez la conversation !
                </div>
              ) : (
                msgs.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} isMine={msg.sender === user?.id} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 items-end bg-white dark:bg-gray-800">
              <textarea
                className="form-input flex-1 resize-none min-h-[42px] max-h-28 rounded-2xl"
                placeholder={t('type_message')}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sendMutation.isLoading}
                className="w-10 h-10 bg-sage-400 hover:bg-sage-500 text-white rounded-full
                           flex items-center justify-center transition-colors flex-shrink-0
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon="💬" title="Choisissez une conversation"
              subtitle="Sélectionnez une conversation ou démarrez-en une nouvelle." />
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)}
        title="Nouvelle Conversation" subtitle="Commencez une discussion sécurisée"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Annuler</button>
            <button className="btn btn-primary"
              disabled={!newRecipient || !newMsg.trim() || startConvMutation.isLoading}
              onClick={() => startConvMutation.mutate({ recipient_id: Number(newRecipient), initial_message: newMsg })}>
              {startConvMutation.isLoading ? '⏳' : 'Démarrer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group mb-0">
            <label className="form-label">Destinataire</label>
            <select className="form-input" value={newRecipient} onChange={e => setNewRecipient(e.target.value)}>
              <option value="">Choisir un conseiller…</option>
              {(counselors || []).map(c => (
                <option key={c.id} value={c.id}>
                  {c.full_name}{c.specialty ? ` — ${c.specialty}` : ''}
                  {!c.is_available ? ' (indisponible)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Message initial</label>
            <textarea className="form-input" rows={4}
              placeholder="Bonjour, j'aurais besoin de votre aide pour…"
              value={newMsg} onChange={e => setNewMsg(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  )
}