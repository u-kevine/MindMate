import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { Sun, Moon } from 'lucide-react'

const SLIDES = [
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1400&q=80',
  'https://images.unsplash.com/photo-1491147334573-44cbb4602074?w=1400&q=80',
  'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1400&q=80',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1400&q=80',
  'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1400&q=80',
]

const ROLES = [
  { value: 'student',   icon: '🎓', labelKey: 'student' },
  { value: 'counselor', icon: '🧑‍⚕️', labelKey: 'counselor' },
  { value: 'admin',     icon: '🛠️',  labelKey: 'admin' },
]

export default function LoginPage() {
  const { login }            = useAuth()
  const { theme, toggleTheme, cycleLang, t } = useTheme()
  const navigate             = useNavigate()
  const [role, setRole]      = useState('student')
  const [slide, setSlide]    = useState(0)
  const [loading, setLoading]= useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: 'student@mindmate.rw', password: 'password' }
  })

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [])

  const handleRoleSelect = (r) => {
    setRole(r)
    if (r === 'student')   { setValue('email', 'student@mindmate.rw');  setValue('password', 'password') }
    if (r === 'counselor') { setValue('email', 'jean@mindmate.rw');     setValue('password', 'password') }
    if (r === 'admin')     { setValue('email', 'admin@mindmate.rw');    setValue('password', 'password') }
  }

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back! 🌿')
      navigate('/')
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Incorrect email or password.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen dark:bg-gray-900">

      {/* ── Left: Slideshow ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {SLIDES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms]"
            style={{ backgroundImage: `url(${src})`, opacity: i === slide ? 1 : 0 }}
          />
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-sage-900/80 via-sage-800/70 to-gray-900/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 w-full">
          <div className="font-display text-5xl text-white mb-3 drop-shadow-lg">🌿 MindMate</div>
          <div className="text-xs uppercase tracking-[3px] text-white/60 mb-12">{t('tagline')}</div>
          <p className="font-display text-2xl text-white leading-relaxed max-w-sm opacity-90 italic">
            "{t('quote')}"
          </p>
          <div className="mt-14 space-y-4 w-full max-w-sm">
            {[
              { icon: '🔒', text: 'Confidential & secure conversations' },
              { icon: '💬', text: 'Direct messaging with counselors' },
              { icon: '📚', text: 'Wellness resources & self-care guides' },
              { icon: '📊', text: 'Track your support journey' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 text-white/85 text-sm">
                <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-base flex-shrink-0">
                  {f.icon}
                </div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-all ${i === slide ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="w-full lg:w-[460px] flex flex-col justify-center px-8 py-12 bg-white dark:bg-gray-800
                      relative transition-colors duration-300">

        {/* Controls */}
        <div className="absolute top-5 right-5 flex gap-2">
          <button
            onClick={cycleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200
                       dark:border-gray-600 text-xs font-bold text-gray-500 dark:text-gray-300
                       hover:border-sage-400 bg-white dark:bg-gray-700 transition-all"
          >
            <span>{t('flag')}</span>
            <span>{t('lang_label')}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600
                       bg-white dark:bg-gray-700 flex items-center justify-center
                       hover:border-sage-400 transition-all"
          >
            {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-gray-500" />}
          </button>
        </div>

        <div className="max-w-sm w-full mx-auto">
          <div className="mb-8">
            <div className="font-display text-3xl text-gray-800 dark:text-gray-100 mb-1">{t('welcome')}</div>
            <p className="text-sm text-gray-400">{t('signin_sub')}</p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <div className="form-label">{t('role_as')}</div>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRoleSelect(r.value)}
                  className={`border-2 rounded-xl p-3 text-center transition-all ${
                    role === r.value
                      ? 'border-sage-400 bg-sage-50 dark:bg-sage-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-sage-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{r.icon}</div>
                  <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t(r.labelKey)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-group">
              <label className="form-label">{t('email')}</label>
              <input
                className="form-input"
                type="email"
                autoComplete="email"
                placeholder="you@university.ac.rw"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }
                })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('password')}</label>
              <input
                className="form-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full btn-lg mt-2"
            >
              {loading ? '⏳ Signing in…' : `${t('signin_btn')} →`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            {t('no_account')}{' '}
            <Link to="/register" className="text-sage-400 font-bold hover:text-sage-500">
              {t('register_here')}
            </Link>
          </p>

          <div className="mt-6 p-4 bg-sage-50 dark:bg-sage-900/20 rounded-xl text-xs text-gray-500 dark:text-gray-400 leading-6 border-l-2 border-sage-400">
            <strong className="text-sage-500">Demo accounts</strong> (password: <code>password</code>)<br />
            🎓 student@mindmate.rw<br />
            🧑‍⚕️ jean@mindmate.rw · sarah@mindmate.rw<br />
            🛠️ admin@mindmate.rw
          </div>
        </div>
      </div>
    </div>
  )
}
