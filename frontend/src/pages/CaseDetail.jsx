import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useState } from 'react'
import { casesApi, authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  PageLoader, StatusBadge, PriorityBadge,
  ProgressBar, Modal, PageHeader,
} from '../components/common/index.jsx'

export default function CaseDetail() {
  const { id }  = useParams()
  const { user }= useAuth()
  const qc      = useQueryClient()
  const [note, setNote]         = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [updateForm, setUpdateForm] = useState({ status: '', priority: '', counselor: null })

  const { data: c, isLoading } = useQuery(
    ['case', id],
    () => casesApi.detail(id).then(r => r.data)
  )
  const { data: counselors } = useQuery(
    'counselors',
    () => authApi.counselors().then(r => r.data),
    { enabled: user?.role !== 'student' }
  )

  const noteMutation = useMutation(
    data => casesApi.addNote(id, data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['case', id])
        setNote('')
        toast.success('Note ajoutée.')
      },
    }
  )

  const updateMutation = useMutation(
    data => casesApi.update(id, data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['case', id])
        qc.invalidateQueries('cases')
        toast.success('Dossier mis à jour.')
        setShowUpdate(false)
      },
    }
  )

  if (isLoading) return <PageLoader />
  if (!c) return <div className="p-8 text-gray-400">Dossier introuvable.</div>

  const isStudent   = user?.role === 'student'
  const isCounselor = user?.role === 'counselor'
  const isAdmin     = user?.role === 'admin'

  const canUpdate = isAdmin || isCounselor

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader
        title={`${c.case_number} — ${c.title}`}
        subtitle={`Soumis le ${new Date(c.created_at).toLocaleDateString('fr')} par ${c.student_name}`}
        actions={
          canUpdate && (
            <button className="btn btn-primary" onClick={() => {
              setUpdateForm({ status: c.status, priority: c.priority, counselor: c.counselor || '' })
              setShowUpdate(true)
            }}>
              Modifier le dossier
            </button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="card-title">Description</div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{c.description}</p>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-title">Notes du Conseiller</div>
            {c.notes?.length > 0 ? (
              <div className="space-y-4">
                {c.notes.map(n => (
                  <div key={n.id} className="bg-sage-50 dark:bg-sage-900/20 rounded-xl p-4 border-l-4 border-sage-400">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{n.author_name}</span>
                      <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString('fr')}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{n.content}</p>
                    {n.is_private && <span className="text-xs text-gray-400 mt-1 block">🔒 Note privée</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucune note pour l'instant.</p>
            )}

            {canUpdate && (
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="form-label">Ajouter une note</div>
                <textarea className="form-input mb-3" rows={3}
                  placeholder="Notes de conseil, recommandations, prochaines étapes…"
                  value={note} onChange={e => setNote(e.target.value)} />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                    <input type="checkbox" className="accent-sage-400"
                      checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
                    Note privée (non visible par l'étudiant)
                  </label>
                  <button className="btn btn-primary btn-sm" disabled={!note.trim() || noteMutation.isLoading}
                    onClick={() => noteMutation.mutate({ content: note, is_private: isPrivate })}>
                    {noteMutation.isLoading ? '⏳' : 'Ajouter'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activity */}
          {c.activities?.length > 0 && (
            <div className="card">
              <div className="card-title">Historique du Dossier</div>
              <div className="space-y-3">
                {c.activities.map(a => (
                  <div key={a.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-sage-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">{a.description}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        {new Date(a.created_at).toLocaleString('fr')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-5">
          <div className="card">
            <div className="card-title mb-4">Informations</div>
            <div className="space-y-3 text-sm">
              {[
                ['Numéro', c.case_number],
                ['Statut', <StatusBadge key="s" status={c.status} />],
                ['Priorité', <PriorityBadge key="p" priority={c.priority} />],
                ['Type', c.case_type],
                ['Étudiant', c.student_name],
                ['Conseiller', c.counselor_name || 'Non assigné'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700/50 pb-2">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title mb-3">Progression</div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Avancement</span>
                <span className="font-bold text-sage-400">{c.progress_percent}%</span>
              </div>
              <ProgressBar percent={c.progress_percent} />
            </div>
            {c.next_session_at && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                <div className="font-bold text-amber-700 dark:text-amber-300 mb-0.5">📅 Prochaine séance</div>
                <div className="text-amber-600 dark:text-amber-400">
                  {new Date(c.next_session_at).toLocaleString('fr')}
                </div>
                {c.session_location && <div className="text-xs text-gray-400 mt-0.5">📍 {c.session_location}</div>}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link to="/cases" className="btn btn-ghost btn-sm flex-1 justify-center">← Retour</Link>
            <Link to="/messages" className="btn btn-outline btn-sm flex-1 justify-center">💬 Messages</Link>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <Modal open={showUpdate} onClose={() => setShowUpdate(false)}
        title="Modifier le Dossier" subtitle="Mettre à jour le statut et les informations"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowUpdate(false)}>Annuler</button>
            <button className="btn btn-primary"
              disabled={updateMutation.isLoading}
              onClick={() => updateMutation.mutate(updateForm)}>
              {updateMutation.isLoading ? '⏳' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group mb-0">
            <label className="form-label">Statut</label>
            <select className="form-input"
              value={updateForm.status}
              onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}>
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Priorité</label>
            <select className="form-input"
              value={updateForm.priority}
              onChange={e => setUpdateForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Élevée</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          {isAdmin && counselors?.length > 0 && (
            <div className="form-group mb-0">
              <label className="form-label">Assigner un conseiller</label>
              <select className="form-input"
                value={updateForm.counselor || ''}
                onChange={e => setUpdateForm(f => ({ ...f, counselor: e.target.value || null }))}>
                <option value="">Non assigné</option>
                {counselors.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} — {c.specialty}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group mb-0">
            <label className="form-label">Prochaine séance (optionnel)</label>
            <input className="form-input" type="datetime-local"
              value={updateForm.next_session_at || ''}
              onChange={e => setUpdateForm(f => ({ ...f, next_session_at: e.target.value }))} />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Lieu de la séance</label>
            <input className="form-input" placeholder="Salle 204, Centre de Conseil…"
              value={updateForm.session_location || ''}
              onChange={e => setUpdateForm(f => ({ ...f, session_location: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}