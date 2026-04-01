// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-7 gap-4 flex-wrap">
      <div>
        <h1 className="font-display text-2xl text-gray-800 dark:text-gray-100">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, change, icon, accent = 'sage' }) {
  const accents = {
    sage:  'bg-sage-50 text-sage-400',
    terra: 'bg-orange-50 text-terra-400',
    blue:  'bg-blue-50 text-blue-500',
    gold:  'bg-amber-50 text-amber-500',
    red:   'bg-red-50 text-red-500',
  }
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{label}</div>
          <div className="font-display text-3xl text-gray-800 dark:text-gray-100 font-semibold">{value}</div>
          {change && <div className="text-xs text-sage-400 mt-1">{change}</div>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${accents[accent]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  open:        { cls: 'badge-open',        label: 'Ouvert' },
  in_progress: { cls: 'badge-progress',    label: 'En cours' },
  resolved:    { cls: 'badge-resolved',    label: 'Résolu' },
  closed:      { cls: 'badge-resolved',    label: 'Fermé' },
}
const PRIORITY_MAP = {
  low:    { cls: 'badge-low',    label: 'Faible' },
  medium: { cls: 'badge-medium', label: 'Moyenne' },
  high:   { cls: 'badge-high',   label: 'Élevée' },
  urgent: { cls: 'badge-urgent', label: 'Urgente' },
}
const ROLE_MAP = {
  student:   { cls: 'badge-student',   label: 'Étudiant' },
  counselor: { cls: 'badge-counselor', label: 'Conseiller' },
  admin:     { cls: 'badge-admin',     label: 'Admin' },
}

export function StatusBadge({ status })   {
  const m = STATUS_MAP[status] || { cls: 'badge-open', label: status }
  return <span className={`badge ${m.cls}`}>{m.label}</span>
}
export function PriorityBadge({ priority }) {
  const m = PRIORITY_MAP[priority] || { cls: 'badge-medium', label: priority }
  return <span className={`badge ${m.cls}`}>{m.label}</span>
}
export function RoleBadge({ role }) {
  const m = ROLE_MAP[role] || { cls: 'badge-student', label: role }
  return <span className={`badge ${m.cls}`}>{m.label}</span>
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-modal w-full max-w-lg
                      border border-gray-100 dark:border-gray-700 animate-slide-up">
        <div className="p-7">
          {title && <h2 className="font-display text-xl text-gray-800 dark:text-gray-100 mb-1">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-400 mb-5">{subtitle}</p>}
          {children}
        </div>
        {footer && (
          <div className="px-7 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📋', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-50">{icon}</div>
      <h3 className="font-display text-xl text-gray-600 dark:text-gray-300 mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mb-5">{subtitle}</p>}
      {action}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={`${sizes[size]} border-2 border-sage-200 border-t-sage-400 rounded-full animate-spin`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    </div>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ percent, color = 'bg-sage-400' }) {
  return (
    <div className="progress-track">
      <div className={`progress-fill ${color}`} style={{ width: `${percent}%` }} />
    </div>
  )
}

// ─── WelcomeBanner ────────────────────────────────────────────────────────────
export function WelcomeBanner({ title, subtitle, emoji = '🌿' }) {
  return (
    <div className="bg-gradient-to-br from-sage-400 to-sage-500 rounded-2xl p-8 mb-7 text-white flex justify-between items-center">
      <div>
        <h2 className="font-display text-2xl mb-2">{title}</h2>
        <p className="text-sm opacity-85 max-w-md leading-relaxed">{subtitle}</p>
      </div>
      <span className="text-6xl opacity-80 hidden sm:block">{emoji}</span>
    </div>
  )
}

// ─── SearchInput ──────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input pl-9"
        style={{ maxWidth: 240 }}
      />
    </div>
  )
}