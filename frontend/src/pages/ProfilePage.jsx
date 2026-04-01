import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { PageHeader, RoleBadge } from '../components/common/index.jsx'
import toast from 'react-hot-toast'
import { Sun, Moon } from 'lucide-react'

const LANG_NAMES = { fr: 'Français', en: 'English', rw: 'Kinyarwanda' }

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { theme, toggleTheme, cycleLang, t, lang } = useTheme()

  const { register, handleSubmit } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name:  user?.last_name  || '',
      phone:      user?.phone      || '',
      bio:        user?.bio        || '',
    },
  })

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    watch: watchPwd,
    formState: { errors: pwdErrors },
  } = useForm()
  const newPwd = watchPwd('new_password')

  const profileMut = useMutation(
    data => authApi.updateMe(data).then(r => r.data),
    {
      onSuccess: data => {
        updateUser(data)
        toast.success('Profil mis à jour ! ✅')
      },
      onError: () => toast.error('Erreur lors de la mise à jour.'),
    }
  )

  const pwdMut = useMutation(
    data => authApi.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Mot de passe modifié !')
        resetPwd()
      },
      onError: err => {
        toast.error(err.response?.data?.old_password?.[0] || 'Erreur.')
      },
    }
  )

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title={t('profile')} subtitle="Gérez vos informations personnelles et préférences" />

      <div className="space-y-6">
        {/* Identity card */}
        <div className="card flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-sage-50 dark:bg-sage-900/30 flex items-center justify-center
                          font-display text-2xl text-sage-400 font-semibold flex-shrink-0 border-2 border-sage-200">
            {user?.initials}
          </div>
          <div>
            <div className="font-display text-xl text-gray-800 dark:text-gray-100 mb-0.5">{user?.full_name}</div>
            <div className="text-sm text-gray-400 mb-2">{user?.email}</div>
            <RoleBadge role={user?.role} />
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
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email} readOnly
                className="form-input bg-gray-50 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed" />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" placeholder="+250 7XX XXX XXX" {...register('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3}
                placeholder="Quelques mots sur vous…" {...register('bio')} />
            </div>
            <button type="submit" disabled={profileMut.isLoading} className="btn btn-primary btn-sm">
              {profileMut.isLoading ? '⏳ Enregistrement…' : '💾 ' + t('save')}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="card-title">Changer le mot de passe</div>
          <form onSubmit={handlePwd(d => pwdMut.mutate({
            old_password: d.old_password,
            new_password: d.new_password,
          }))}>
            <div className="space-y-3 mb-4">
              <div className="form-group mb-0">
                <label className="form-label">Mot de passe actuel</label>
                <input className="form-input" type="password"
                  {...regPwd('old_password', { required: 'Requis' })} />
                {pwdErrors.old_password && <p className="form-error">{pwdErrors.old_password.message}</p>}
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Nouveau mot de passe</label>
                <input className="form-input" type="password"
                  {...regPwd('new_password', { required: 'Requis', minLength: { value: 8, message: '8 caractères minimum' } })} />
                {pwdErrors.new_password && <p className="form-error">{pwdErrors.new_password.message}</p>}
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Confirmer le nouveau mot de passe</label>
                <input className="form-input" type="password"
                  {...regPwd('confirm', {
                    validate: v => v === newPwd || 'Les mots de passe ne correspondent pas',
                  })} />
                {pwdErrors.confirm && <p className="form-error">{pwdErrors.confirm.message}</p>}
              </div>
            </div>
            <button type="submit" disabled={pwdMut.isLoading} className="btn btn-outline btn-sm">
              {pwdMut.isLoading ? '⏳ Mise à jour…' : '🔐 Mettre à jour'}
            </button>
          </form>
        </div>

        {/* Preferences */}
        <div className="card">
          <div className="card-title">Préférences</div>
          <div className="space-y-0">
            {/* Language */}
            <div className="flex justify-between items-center py-4 border-b border-gray-50 dark:border-gray-700">
              <div>
                <div className="font-bold text-sm text-gray-700 dark:text-gray-200">Langue de l'interface</div>
                <div className="text-xs text-gray-400 mt-0.5">{t('flag')} {LANG_NAMES[lang]}</div>
              </div>
              <button onClick={cycleLang} className="btn btn-outline btn-sm">
                Changer la langue
              </button>
            </div>

            {/* Theme */}
            <div className="flex justify-between items-center py-4">
              <div>
                <div className="font-bold text-sm text-gray-700 dark:text-gray-200">Thème d'affichage</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {theme === 'dark' ? '🌙 Mode sombre activé' : '☀️ Mode clair activé'}
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200
                           dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-bold
                           hover:border-sage-400 transition-all"
              >
                {theme === 'dark'
                  ? <><Sun size={14} className="text-amber-400" /><span className="text-gray-500 dark:text-gray-300">Mode clair</span></>
                  : <><Moon size={14} className="text-gray-500" /><span className="text-gray-500">Mode sombre</span></>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}