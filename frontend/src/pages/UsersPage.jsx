import { useState } from 'react'
import { useQuery } from 'react-query'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'
import { PageHeader, PageLoader, RoleBadge } from '../components/common/index.jsx'

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch]         = useState('')

  const { data, isLoading } = useQuery(
    ['users', roleFilter],
    () => authApi.users({ role: roleFilter || undefined }).then(r => r.data)
  )
  const users = (data?.results || data || []).filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gestion des Utilisateurs"
        subtitle="Gérez tous les comptes étudiants, conseillers et administrateurs"
        actions={
          <button className="btn btn-terra btn-sm"
            onClick={() => toast('Formulaire d\'ajout à implémenter')}>
            + Ajouter un utilisateur
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          className="form-input"
          style={{ maxWidth: 240 }}
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {[
          { value: '',           label: 'Tous' },
          { value: 'student',    label: 'Étudiants' },
          { value: 'counselor',  label: 'Conseillers' },
          { value: 'admin',      label: 'Admins' },
        ].map(r => (
          <button key={r.value} onClick={() => setRoleFilter(r.value)}
            className={`btn btn-sm ${roleFilter === r.value ? 'btn-primary' : 'btn-outline'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="mm-table">
              <thead>
                <tr>
                  <th>Nom complet</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sage-50 dark:bg-sage-900/30 flex items-center
                                        justify-center text-sage-400 text-xs font-bold">
                          {u.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-100">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="text-gray-400">{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-resolved' : 'badge-urgent'}`}>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs">
                      {new Date(u.date_joined).toLocaleDateString('fr')}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm"
                          onClick={() => toast(`Édition de ${u.full_name}`)}>
                          Modifier
                        </button>
                        <button className="btn btn-sm"
                          style={{ background: 'var(--tw-color-red-50, #fef2f2)', color: '#ef4444' }}
                          onClick={() => toast.error(`Désactivation de ${u.full_name}`)}>
                          {u.is_active ? 'Désactiver' : 'Réactiver'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700 text-xs text-gray-400">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''} trouvé{users.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}