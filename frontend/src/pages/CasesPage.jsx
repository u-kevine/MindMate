import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { casesApi, authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import {
  PageHeader, StatusBadge, PriorityBadge, Modal,
  EmptyState, PageLoader, SearchInput, ProgressBar,
} from '../components/common/index.jsx'

const CASE_TYPES = [
  { value: 'academic',     label: 'Stress Académique' },
  { value: 'anxiety',      label: 'Anxiété' },
  { value: 'grief',        label: 'Deuil & Perte' },
  { value: 'relationship', label: 'Relations' },
  { value: 'depression',   label: 'Dépression' },
  { value: 'trauma',       label: 'Trauma' },
  { value: 'other',        label: 'Autre' },
]
const PRIORITIES = [
  { value: 'low',    label: 'Faible — bien-être général' },
  { value: 'medium', label: 'Moyenne — affecte la vie quotidienne' },
  { value: 'high',   label: 'Élevée — besoin d\'aide urgente' },
  { value: 'urgent', label: 'Urgente — crise immédiate' },
]

export default function CasesPage() {
  const { user }    = useAuth()
  const { t }       = useTheme()
  const qc          = useQueryClient()
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate]     = useState(false)

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
        toast.success('Demande soumise ! Un conseiller vous répondra sous 24h. 🌿')
        setShowCreate(false)
        reset()
      },
      onError: err => {
        toast.error(err.response?.data?.detail || 'Erreur lors de la soumission.')
      },
    }
  )

  const cases = (data?.results || []).filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.case_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.student_name?.toLowerCase().includes(search.toLowerCase())
  )

  const statuses = [
    { value: '',            label: 'Tous' },
    { value: 'open',        label: 'Ouverts' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'resolved',    label: 'Résolus' },
  ]

  const isStudent = user?.role === 'student'

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isStudent ? t('my_cases') : t('cases')}
        subtitle={isStudent ? 'Suivez vos demandes de soutien' : 'Gérez tous les dossiers étudiants'}
        actions={
          isStudent && (
            <button className="btn btn-terra" onClick={() => setShowCreate(true)}>
              {t('new_request')}
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un dossier…" />
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`btn btn-sm ${statusFilter === s.value ? 'btn-primary' : 'btn-outline'}`}>
              {s.label}
            </button>
          ))}
        </div>
        {!isStudent && (
          <select className="form-input" style={{ maxWidth: 200 }}
            onChange={e => { /* filter by type */ }}>
            <option>Tous les types</option>
            {CASE_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      {isLoading ? <PageLoader /> : cases.length === 0 ? (
        <EmptyState icon="📋" title="Aucun dossier trouvé"
          subtitle={isStudent ? "Soumettez votre première demande de soutien." : "Aucun dossier ne correspond à vos filtres."}
          action={isStudent && (
            <button className="btn btn-terra" onClick={() => setShowCreate(true)}>{t('new_request')}</button>
          )}
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Dossier</th>
                  {!isStudent && <th>Étudiant</th>}
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Priorité</th>
                  <th>Statut</th>
                  <th>Progression</th>
                  {!isStudent && <th>Conseiller</th>}
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id}>
                    <td className="font-bold text-sage-400 font-mono">{c.case_number}</td>
                    {!isStudent && <td className="font-medium">{c.student_name}</td>}
                    <td className="max-w-xs truncate">{c.title}</td>
                    <td className="text-gray-500 text-xs">{c.case_type}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ width: 100 }}>
                      <ProgressBar percent={c.progress_percent} />
                      <div className="text-xs text-gray-400 mt-0.5">{c.progress_percent}%</div>
                    </td>
                    {!isStudent && <td className="text-gray-500 text-xs">{c.counselor_name || '—'}</td>}
                    <td className="text-gray-400 text-xs whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('fr')}
                    </td>
                    <td>
                      <Link to={`/cases/${c.id}`} className="btn btn-outline btn-sm">Voir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nouvelle Demande de Soutien"
        subtitle="Votre demande est entièrement confidentielle 🔒"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Annuler</button>
            <button className="btn btn-terra" form="create-case-form" type="submit"
              disabled={createMutation.isLoading}>
              {createMutation.isLoading ? '⏳ Envoi…' : 'Soumettre la demande'}
            </button>
          </>
        }
      >
        <form id="create-case-form" onSubmit={handleSubmit(d => createMutation.mutate(d))}>
          <div className="space-y-4">
            <div className="form-group mb-0">
              <label className="form-label">Titre / Sujet</label>
              <input className="form-input" placeholder="Décrivez brièvement votre situation…"
                {...register('title', { required: 'Le titre est requis' })} />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group mb-0">
                <label className="form-label">Type de soutien</label>
                <select className="form-input" {...register('case_type', { required: true })}>
                  {CASE_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Niveau de priorité</label>
                <select className="form-input" {...register('priority')}>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Comment vous sentez-vous ?</label>
              <textarea className="form-input" rows={4}
                placeholder="Décrivez ce que vous vivez. C'est un espace sûr et confidentiel…"
                {...register('description', { required: 'La description est requise' })} />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            {counselors?.length > 0 && (
              <div className="form-group mb-0">
                <label className="form-label">Conseiller préféré (optionnel)</label>
                <select className="form-input" {...register('counselor')}>
                  <option value="">Pas de préférence</option>
                  {counselors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}{c.specialty ? ` — ${c.specialty}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <input type="checkbox" className="w-4 h-4 accent-sage-400" {...register('is_urgent')} />
              <div>
                <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Marquer comme urgent</div>
                <div className="text-xs text-gray-400">Si vous avez besoin d'une aide immédiate</div>
              </div>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}