import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../services/api'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function RegisterPage() {
  const { t, cycleLang, toggleTheme, theme } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('student')
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authApi.register({ ...data, role })
      toast.success('Compte créé ! Connectez-vous maintenant.')
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data
      const msg = typeof detail === 'string' ? detail
        : Object.values(detail || {}).flat().join(' ') || 'Erreur lors de la création.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-modal p-8 border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <div className="font-display text-2xl text-sage-400 mb-0.5">🌿 MindMate</div>
            <h1 className="font-display text-xl text-gray-800 dark:text-gray-100">{t('register')}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={cycleLang} className="px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-500 dark:text-gray-300 hover:border-sage-400">
              {t('flag')} {t('lang_label')}
            </button>
          </div>
        </div>

        {/* Role selector */}
        <div className="mb-5">
          <div className="form-label">{t('role_as')}</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'student', icon: '🎓', label: t('student') },
              { value: 'counselor', icon: '🧑‍⚕️', label: t('counselor') },
            ].map(r => (
              <button key={r.value} type="button" onClick={() => setRole(r.value)}
                className={`border-2 rounded-xl p-3 flex items-center gap-3 transition-all ${
                  role === r.value ? 'border-sage-400 bg-sage-50 dark:bg-sage-900/20' : 'border-gray-200 dark:border-gray-600'
                }`}>
                <span className="text-xl">{r.icon}</span>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">{t('first_name')}</label>
              <input className="form-input" placeholder="Amina"
                {...register('first_name', { required: 'Requis' })} />
              {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">{t('last_name')}</label>
              <input className="form-input" placeholder="Uwase"
                {...register('last_name', { required: 'Requis' })} />
              {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">{t('email')}</label>
            <input className="form-input" type="email" placeholder="vous@universite.ac.rw"
              {...register('email', { required: 'Requis', pattern: { value: /\S+@\S+\.\S+/, message: 'Email invalide' } })} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          {role === 'student' && (
            <div className="form-group mb-0">
              <label className="form-label">{t('student_id')}</label>
              <input className="form-input" placeholder="UR/2024/BSC/001"
                {...register('student_id')} />
            </div>
          )}

          <div className="form-group mb-0">
            <label className="form-label">{t('password')}</label>
            <input className="form-input" type="password" placeholder="Minimum 8 caractères"
              {...register('password', { required: 'Requis', minLength: { value: 8, message: '8 caractères minimum' } })} />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Confirmer le mot de passe</label>
            <input className="form-input" type="password" placeholder="••••••••"
              {...register('password2', {
                required: 'Requis',
                validate: v => v === password || 'Les mots de passe ne correspondent pas'
              })} />
            {errors.password2 && <p className="form-error">{errors.password2.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg mt-2">
            {loading ? '⏳ Création…' : t('create_account')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          {t('have_account')}{' '}
          <Link to="/login" className="text-sage-400 font-bold hover:text-sage-500">{t('sign_in_here')}</Link>
        </p>
      </div>
    </div>
  )
}