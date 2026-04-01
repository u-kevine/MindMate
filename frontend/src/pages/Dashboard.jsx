import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { authApi, casesApi, resourcesApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  PageLoader, StatCard, WelcomeBanner, StatusBadge,
  PriorityBadge, ProgressBar, EmptyState,
} from '../components/common/index.jsx'

// ─── Student Dashboard ────────────────────────────────────────────────────────
function StudentDashboard({ stats }) {
  const { user } = useAuth()
  const { t } = useTheme()
  const { data: casesData } = useQuery('my-cases', () => casesApi.list({ status: 'in_progress' }).then(r => r.data))
  const { data: resData }   = useQuery('featured-resources', () => resourcesApi.list({ is_featured: true }).then(r => r.data))

  const activeCase = casesData?.results?.[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <WelcomeBanner
        title={`${t('hello')}, ${user?.full_name?.split(' ')[0]} 🌱`}
        subtitle={t('not_alone')}
        emoji="🌿"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('active_requests')} value={stats?.active_cases ?? 0}   icon="📋" accent="sage" change="Demandes actives" />
        <StatCard label={t('unread_msgs')}     value={stats?.unread_messages ?? 0} icon="💬" accent="blue" change="Nouveaux messages" />
        <StatCard label={t('resources_read')}  value={stats?.resources_read ?? 7}  icon="📚" accent="gold" change="Cette semaine" />
        <StatCard label={t('sessions_done')}   value={stats?.total_cases ?? 0}     icon="✅" accent="terra" change="Au total" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Active case */}
        <div className="lg:col-span-3 card">
          <div className="card-title">Dossier Actif</div>
          <div className="card-sub">Votre demande de soutien en cours</div>
          {activeCase ? (
            <div className="bg-sage-50 dark:bg-sage-900/20 rounded-xl p-5 border-l-4 border-sage-400">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-100">{activeCase.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {activeCase.case_number} · {activeCase.counselor_name || 'Non assigné'}
                  </div>
                </div>
                <StatusBadge status={activeCase.status} />
              </div>
              <ProgressBar percent={activeCase.progress_percent} />
              <div className="text-xs text-gray-400 mt-2">{activeCase.progress_percent}% résolu</div>
              <Link to={`/cases/${activeCase.id}`} className="btn btn-outline btn-sm mt-4 inline-flex">
                Voir le dossier →
              </Link>
            </div>
          ) : (
            <EmptyState icon="📋" title="Aucun dossier actif"
              subtitle="Soumettez une demande pour commencer."
              action={<Link to="/cases" className="btn btn-terra btn-sm">+ Nouvelle demande</Link>}
            />
          )}
        </div>

        {/* Quick links */}
        <div className="lg:col-span-2 card">
          <div className="card-title">Accès Rapide</div>
          <div className="card-sub">Vos ressources et outils</div>
          <div className="space-y-2">
            {[
              { icon: '💬', label: 'Contacter mon conseiller', to: '/messages', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { icon: '📚', label: 'Explorer les ressources', to: '/resources', color: 'bg-amber-50 dark:bg-amber-900/20' },
              { icon: '📋', label: 'Mes demandes', to: '/cases', color: 'bg-sage-50 dark:bg-sage-900/20' },
            ].map(({ icon, label, to, color }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-3 p-3.5 rounded-xl ${color} hover:opacity-80 transition-opacity`}>
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{label}</span>
                <span className="ml-auto text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended resources */}
      {resData?.results?.length > 0 && (
        <div className="card">
          <div className="card-title">Ressources Recommandées</div>
          <div className="card-sub">Basées sur votre profil de soutien</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {resData.results.slice(0, 3).map(r => (
              <Link key={r.id} to="/resources"
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-sage-300 transition-colors">
                <div className="text-2xl mb-2">{r.category_icon}</div>
                <div className="font-bold text-sm text-gray-800 dark:text-gray-100 mb-1">{r.title}</div>
                <div className="text-xs text-gray-400">{r.read_time_minutes} min · {r.view_count} lectures</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Counselor Dashboard ──────────────────────────────────────────────────────
function CounselorDashboard({ stats }) {
  const { user } = useAuth()
  const { data: casesData } = useQuery('counselor-cases', () => casesApi.list({ status: 'open' }).then(r => r.data))

  return (
    <div className="space-y-6 animate-fade-in">
      <WelcomeBanner
        title={`Bienvenue, ${user?.full_name?.split(' ').pop()} 💙`}
        subtitle="Vous faites une vraie différence. Voici votre aperçu du jour."
        emoji="🧑‍⚕️"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Dossiers ouverts"  value={stats?.open_cases ?? 0}        icon="📋" accent="terra"  change="À traiter" />
        <StatCard label="En cours"          value={stats?.in_progress_cases ?? 0}  icon="🔄" accent="blue"   change="Gestion active" />
        <StatCard label="Résolus (mois)"    value={stats?.resolved_cases ?? 0}     icon="✅" accent="sage"   change="↑ Ce mois" />
        <StatCard label="Total assignés"    value={stats?.total_assigned ?? 0}     icon="📊" accent="gold"   change="Tous statuts" />
      </div>
      <div className="card">
        <div className="card-title">Dossiers Ouverts</div>
        <div className="card-sub">Nécessitent votre attention</div>
        {casesData?.results?.length > 0 ? (
          <div className="table-container">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Dossier</th><th>Étudiant</th><th>Type</th>
                  <th>Priorité</th><th>Date</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {casesData.results.map(c => (
                  <tr key={c.id}>
                    <td className="font-bold text-sage-400">{c.case_number}</td>
                    <td>{c.student_name}</td>
                    <td className="text-gray-500">{c.case_type}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td className="text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString('fr')}</td>
                    <td>
                      <Link to={`/cases/${c.id}`} className="btn btn-outline btn-sm">Voir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="✅" title="Aucun dossier en attente" subtitle="Tous les dossiers sont traités !" />
        )}
      </div>
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ stats }) {
  const { data: caseStats } = useQuery('case-stats', () => casesApi.stats().then(r => r.data))

  const byType = caseStats?.by_type || {}
  const total  = Object.values(byType).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="space-y-6 animate-fade-in">
      <WelcomeBanner title="Vue d'ensemble du système 🛠️"
        subtitle="MindMate fonctionne correctement. Résumé de l'activité en temps réel."
        emoji="📊"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Étudiants"        value={stats?.total_students   ?? 0} icon="👩‍🎓" accent="sage"  change="Inscrits" />
        <StatCard label="Conseillers"      value={stats?.total_counselors ?? 0} icon="🧑‍⚕️" accent="blue"  change="Actifs" />
        <StatCard label="Dossiers ouverts" value={stats?.open_cases       ?? 0} icon="📋" accent="terra" change="À assigner" />
        <StatCard label="Ressources"       value={stats?.total_resources  ?? 0} icon="📚" accent="gold"  change="Publiées" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-title">Dossiers par Type</div>
          <div className="card-sub">Distribution ce mois</div>
          <div className="space-y-4 mt-2">
            {[
              { key: 'academic',     label: 'Stress Académique', color: 'bg-sage-400' },
              { key: 'anxiety',      label: 'Anxiété',           color: 'bg-blue-400' },
              { key: 'grief',        label: 'Deuil & Perte',     color: 'bg-amber-400' },
              { key: 'relationship', label: 'Relations',         color: 'bg-terra-400' },
            ].map(({ key, label, color }) => {
              const count = byType[key] || 0
              const pct   = Math.round((count / total) * 100)
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-300">{label}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{pct}%</span>
                  </div>
                  <ProgressBar percent={pct} color={color} />
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Statut des Dossiers</div>
          <div className="card-sub">Vue globale</div>
          <div className="space-y-4 mt-2">
            {[
              { key: 'open',        label: 'Ouverts',   color: 'bg-amber-400', val: caseStats?.open        ?? 0 },
              { key: 'in_progress', label: 'En cours',  color: 'bg-blue-400',  val: caseStats?.in_progress ?? 0 },
              { key: 'resolved',    label: 'Résolus',   color: 'bg-sage-400',  val: caseStats?.resolved    ?? 0 },
              { key: 'urgent',      label: 'Urgents',   color: 'bg-red-400',   val: caseStats?.urgent      ?? 0 },
            ].map(({ label, color, val }) => (
              <div key={label} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />
                <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">{label}</span>
                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link to="/reports" className="btn btn-outline btn-sm">Voir tous les rapports →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useQuery(
    'dashboard-stats',
    () => authApi.dashboardStats().then(r => r.data),
    { staleTime: 60_000 }
  )

  if (isLoading) return <PageLoader />

  if (user?.role === 'student')   return <StudentDashboard stats={stats} />
  if (user?.role === 'counselor') return <CounselorDashboard stats={stats} />
  return <AdminDashboard stats={stats} />
}