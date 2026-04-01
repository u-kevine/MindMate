// ════════════════════════════════════════════════════════════
//  ResourcesPage
// ════════════════════════════════════════════════════════════
import { useState } from 'react'
import { useQuery } from 'react-query'
import { resourcesApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader, PageLoader, EmptyState } from '../components/common/index.jsx'

export function ResourcesPage() {
  const { user }  = useAuth()
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch]       = useState('')

  const { data: categories } = useQuery('categories', () => resourcesApi.categories().then(r => r.data))
  const { data, isLoading }  = useQuery(
    ['resources', catFilter],
    () => resourcesApi.list({ category: catFilter || undefined }).then(r => r.data)
  )
  const cats = categories?.results || categories || []
  const resources = (data?.results || data || []).filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Ressources Bien-être" subtitle="Matériels éducatifs sur la santé mentale" />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setCatFilter('')}
          className={`btn btn-sm ${!catFilter ? 'btn-primary' : 'btn-outline'}`}>
          Tous
        </button>
        {cats.map(c => (
          <button key={c.id} onClick={() => setCatFilter(c.id)}
            className={`btn btn-sm ${catFilter == c.id ? 'btn-primary' : 'btn-outline'}`}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <input className="form-input" style={{ maxWidth: 280 }}
          placeholder="Rechercher une ressource…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? <PageLoader /> : resources.length === 0 ? (
        <EmptyState icon="📚" title="Aucune ressource" subtitle="Revenez bientôt !" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map(r => (
            <div key={r.id}
              className="card p-0 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-panel transition-all duration-200">
              <div className="h-28 flex items-center justify-center text-5xl"
                style={{ background: r.category_color || '#EBF3EC' }}>
                {r.category_icon || '📄'}
              </div>
              <div className="p-5">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{r.category_name}</div>
                <h3 className="font-display text-base text-gray-800 dark:text-gray-100 mb-2 leading-snug">{r.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">{r.description}</p>
                <div className="flex justify-between text-xs text-gray-400 pt-3 border-t border-gray-50 dark:border-gray-700">
                  <span>👁 {r.view_count} lectures</span>
                  <span>🕐 {r.read_time_minutes} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  UsersPage (Admin only)
// ════════════════════════════════════════════════════════════
import { useQuery as useQ2 } from 'react-query'
import { authApi } from '../services/api'
import { RoleBadge } from '../components/common/index.jsx'

export function UsersPage() {
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch]         = useState('')
  const { data, isLoading }         = useQ2(
    ['users', roleFilter],
    () => authApi.users({ role: roleFilter || undefined }).then(r => r.data)
  )
  const users = (data?.results || data || []).filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gestion des Utilisateurs"
        subtitle="Gérez tous les comptes étudiants et conseillers"
        actions={<button className="btn btn-terra btn-sm">+ Ajouter un utilisateur</button>}
      />
      <div className="flex gap-3 mb-5 flex-wrap">
        <input className="form-input" style={{ maxWidth: 240 }}
          placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        {['', 'student', 'counselor', 'admin'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`}>
            {r === '' ? 'Tous' : r === 'student' ? 'Étudiants' : r === 'counselor' ? 'Conseillers' : 'Admins'}
          </button>
        ))}
      </div>
      {isLoading ? <PageLoader /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="mm-table">
              <thead>
                <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Inscrit le</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.full_name}</td>
                    <td className="text-gray-400">{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-resolved' : 'badge-urgent'}`}>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs">{new Date(u.date_joined).toLocaleDateString('fr')}</td>
                    <td>
                      <button className="btn btn-outline btn-sm"
                        onClick={() => toast('Édition à implémenter')}>Modifier</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  ReportsPage
// ════════════════════════════════════════════════════════════
import { useQuery as useQ3 } from 'react-query'
import { casesApi as cApi } from '../services/api'
import { StatCard as SC, ProgressBar as PB } from '../components/common/index.jsx'

export function ReportsPage() {
  const { data: stats } = useQ3('case-stats', () => cApi.stats().then(r => r.data))
  const { data: dashStats } = useQ3('dash-stats-report', () => authApi.dashboardStats().then(r => r.data))

  const TYPE_LABELS = {
    academic: 'Stress Académique', anxiety: 'Anxiété',
    grief: 'Deuil', relationship: 'Relations', depression: 'Dépression',
    trauma: 'Trauma', other: 'Autre',
  }
  const byType = stats?.by_type || {}
  const total  = Object.values(byType).reduce((a, b) => a + b, 0) || 1

  const COLORS = [
    'bg-sage-400','bg-blue-400','bg-amber-400','bg-terra-400',
    'bg-purple-400','bg-pink-400','bg-gray-400',
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Rapports & Analyses" subtitle="Métriques du système MindMate"
        actions={
          <button className="btn btn-outline btn-sm"
            onClick={() => alert('Export PDF — intégration backend requise')}>
            📄 Exporter PDF
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <SC label="Dossiers ouverts"    value={stats?.open        ?? 0} icon="📋" accent="terra" />
        <SC label="En cours"            value={stats?.in_progress ?? 0} icon="🔄" accent="blue"  />
        <SC label="Résolus"             value={stats?.resolved    ?? 0} icon="✅" accent="sage"  />
        <SC label="Urgents"             value={stats?.urgent      ?? 0} icon="🚨" accent="red"   />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-title">Distribution par type</div>
          <div className="card-sub">Dossiers ce mois</div>
          <div className="space-y-4 mt-2">
            {Object.entries(byType).map(([key, count], i) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 dark:text-gray-300">{TYPE_LABELS[key] || key}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100">
                    {Math.round((count / total) * 100)}%
                  </span>
                </div>
                <PB percent={Math.round((count / total) * 100)} color={COLORS[i % COLORS.length]} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Résumé mensuel</div>
          <div className="card-sub">Indicateurs clés de performance</div>
          <div className="space-y-0">
            {[
              ['Taux de résolution', '84%'],
              ['Temps de réponse moyen', '4h'],
              ['Satisfaction étudiante', '4,7 / 5'],
              ['Total dossiers (mois)', (stats?.open ?? 0) + (stats?.in_progress ?? 0) + (stats?.resolved ?? 0)],
              ['Étudiants inscrits', dashStats?.total_students ?? '—'],
              ['Conseillers actifs', dashStats?.total_counselors ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 border-b border-gray-50 dark:border-gray-700/50">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  ProfilePage
// ════════════════════════════════════════════════════════════
import { useForm as useF2 } from 'react-hook-form'
import { useMutation as useMut } from 'react-query'
import { useAuth as useA } from '../contexts/AuthContext'
import { useTheme as useT } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { RoleBadge as RB } from '../components/common/index.jsx'
import { Sun, Moon } from 'lucide-react'

export function ProfilePage() {
  const { user, updateUser } = useA()
  const { theme, toggleTheme, cycleLang, t, lang } = useT()
  const { register, handleSubmit } = useF2({ defaultValues: {
    first_name: user?.first_name, last_name: user?.last_name,
    phone: user?.phone || '', bio: user?.bio || '',
  }})
  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, watch: watchPwd } = useF2()
  const newPwd = watchPwd('new_password')

  const profileMut = useMut(
    data => authApi.updateMe(data).then(r => r.data),
    { onSuccess: data => { updateUser(data); toast.success('Profil mis à jour !') } }
  )
  const pwdMut = useMut(
    data => authApi.changePassword(data),
    { onSuccess: () => { toast.success('Mot de passe modifié !'); resetPwd() } }
  )

  const LANGS = { fr: 'Français', en: 'English', rw: 'Kinyarwanda' }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title={t('profile')} subtitle="Gérez vos informations personnelles" />

      <div className="space-y-6">
        {/* Avatar & identity */}
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-sage-50 dark:bg-sage-900/30 flex items-center justify-center
                          font-display text-2xl text-sage-400 font-semibold flex-shrink-0">
            {user?.initials}
          </div>
          <div>
            <div className="font-display text-xl text-gray-800 dark:text-gray-100">{user?.full_name}</div>
            <div className="text-sm text-gray-400 mb-1">{user?.email}</div>
            <RB role={user?.role} />
          </div>
        </div>

        {/* Edit profile */}
        <div className="card">
          <div className="card-title">Informations personnelles</div>
          <form onSubmit={handleSubmit(d => profileMut.mutate(d))}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group mb-0">
                <label className="form-label">Prénom</label>
                <input className="form-input" {...register('first_name')} />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Nom</label>
                <input className="form-input" {...register('last_name')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" placeholder="+250 7XX XXX XXX" {...register('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} placeholder="Quelques mots sur vous…" {...register('bio')} />
            </div>
            <button type="submit" disabled={profileMut.isLoading} className="btn btn-primary btn-sm">
              {profileMut.isLoading ? '⏳ Enregistrement…' : t('save')}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="card-title">Changer le mot de passe</div>
          <form onSubmit={handlePwd(d => pwdMut.mutate({ old_password: d.old_password, new_password: d.new_password }))}>
            <div className="space-y-3 mb-4">
              <div className="form-group mb-0">
                <label className="form-label">Mot de passe actuel</label>
                <input className="form-input" type="password" {...regPwd('old_password', { required: true })} />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Nouveau mot de passe</label>
                <input className="form-input" type="password" {...regPwd('new_password', { required: true, minLength: 8 })} />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Confirmer</label>
                <input className="form-input" type="password" {...regPwd('confirm', {
                  validate: v => v === newPwd || 'Les mots de passe ne correspondent pas'
                })} />
              </div>
            </div>
            <button type="submit" disabled={pwdMut.isLoading} className="btn btn-outline btn-sm">
              {pwdMut.isLoading ? '⏳' : 'Mettre à jour'}
            </button>
          </form>
        </div>

        {/* Preferences */}
        <div className="card">
          <div className="card-title">Préférences</div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-700">
              <div>
                <div className="font-bold text-sm text-gray-700 dark:text-gray-200">Langue</div>
                <div className="text-xs text-gray-400">{t('flag')} {LANGS[lang]}</div>
              </div>
              <button onClick={cycleLang} className="btn btn-outline btn-sm">Changer</button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-sm text-gray-700 dark:text-gray-200">Thème</div>
                <div className="text-xs text-gray-400">{theme === 'dark' ? '🌙 Mode sombre' : '☀️ Mode clair'}</div>
              </div>
              <button onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-xs font-bold hover:border-sage-400 transition-all">
                {theme === 'dark' ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-gray-500" />}
                <span className="text-gray-500 dark:text-gray-300">{theme === 'dark' ? 'Passer au clair' : 'Passer au sombre'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  NotFound
// ════════════════════════════════════════════════════════════
import { Link as RLink } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center text-center p-8">
      <div>
        <div className="text-7xl mb-6">🌿</div>
        <h1 className="font-display text-4xl text-gray-800 dark:text-gray-100 mb-3">404</h1>
        <p className="text-gray-400 mb-6">Cette page n'existe pas ou a été déplacée.</p>
        <RLink to="/" className="btn btn-primary inline-flex">Retour à l'accueil</RLink>
      </div>
    </div>
  )
}

// ── Default exports as separate page files ──
export default ResourcesPage