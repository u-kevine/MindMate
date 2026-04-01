import { useQuery } from 'react-query'
import { casesApi, authApi } from '../services/api'
import { PageHeader, StatCard, ProgressBar } from '../components/common/index.jsx'

const TYPE_LABELS = {
  academic: 'Stress Académique', anxiety: 'Anxiété',
  grief: 'Deuil & Perte', relationship: 'Relations',
  depression: 'Dépression', trauma: 'Trauma', other: 'Autre',
}
const BAR_COLORS = [
  'bg-sage-400', 'bg-blue-400', 'bg-amber-400',
  'bg-terra-400', 'bg-purple-400', 'bg-pink-400', 'bg-gray-400',
]

export default function ReportsPage() {
  const { data: stats }     = useQuery('case-stats',  () => casesApi.stats().then(r => r.data))
  const { data: dashStats } = useQuery('dash-stats-r', () => authApi.dashboardStats().then(r => r.data))

  const byType = stats?.by_type || {}
  const total  = Object.values(byType).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Rapports & Analyses"
        subtitle="Métriques et indicateurs de performance du système"
        actions={
          <button
            className="btn btn-outline btn-sm"
            onClick={() => alert('Export PDF — à connecter au backend')}
          >
            📄 Exporter PDF
          </button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Dossiers ouverts"  value={stats?.open        ?? 0} icon="📋" accent="terra" change="À traiter" />
        <StatCard label="En cours"          value={stats?.in_progress ?? 0} icon="🔄" accent="blue"  change="Gestion active" />
        <StatCard label="Résolus"           value={stats?.resolved    ?? 0} icon="✅" accent="sage"  change="Clôturés" />
        <StatCard label="Urgents"           value={stats?.urgent      ?? 0} icon="🚨" accent="red"   change="Priorité haute" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By type */}
        <div className="card">
          <div className="card-title">Dossiers par type</div>
          <div className="card-sub">Distribution ce mois</div>
          <div className="space-y-4 mt-2">
            {Object.entries(byType).map(([key, count], i) => {
              const pct = Math.round((count / total) * 100)
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-300">{TYPE_LABELS[key] || key}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{pct}%</span>
                  </div>
                  <ProgressBar percent={pct} color={BAR_COLORS[i % BAR_COLORS.length]} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="card">
          <div className="card-title">Résumé mensuel</div>
          <div className="card-sub">Indicateurs clés de performance</div>
          <div className="space-y-0 mt-2">
            {[
              ['Taux de résolution',      '84%'],
              ['Temps de réponse moyen',  '4h'],
              ['Satisfaction étudiante',  '4,7 / 5,0'],
              ['Total dossiers (mois)',    (stats?.open ?? 0) + (stats?.in_progress ?? 0) + (stats?.resolved ?? 0)],
              ['Étudiants inscrits',      dashStats?.total_students   ?? '—'],
              ['Conseillers actifs',      dashStats?.total_counselors ?? '—'],
              ['Ressources publiées',     dashStats?.total_resources  ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
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