import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTheme } from '../contexts/ThemeContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'student',   icon: '🎓', label: 'Student',   desc: 'Access support, book sessions, browse resources' },
  { value: 'counselor', icon: '🧑‍⚕️', label: 'Counselor', desc: 'Support students and manage cases' },
]

export default function RegisterPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/auth/register/', {
        email:      data.email,
        first_name: data.first_name,
        last_name:  data.last_name,
        password:   data.password,
        password2:  data.password2,
        role:       role,
        student_id: data.student_id || undefined,
      })
      toast.success('Account created! Check your email for a welcome message 📧')
      navigate('/login')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const first = Object.values(errors)[0]
        toast.error(Array.isArray(first) ? first[0] : first)
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const bg   = dark ? 'bg-gray-900' : 'bg-gray-50'
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const text = dark ? 'text-gray-100' : 'text-gray-800'
  const sub  = dark ? 'text-gray-400' : 'text-gray-500'
  const inp  = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-green-400 transition-all ${
    dark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
         : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
  }`
  const err  = 'text-red-400 text-xs mt-1'
  const label = `block text-xs font-semibold mb-1.5 ${sub}`

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bg}`}>
      <div className={`w-full max-w-md rounded-2xl border shadow-lg p-8 ${card}`}>

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="font-display text-3xl text-green-600 mb-1">🌿 MindMate</div>
          <p className={`text-sm ${sub}`}>Create your account</p>
        </div>

        {/* Role selector */}
        <div className="mb-6">
          <label className={label}>I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(r => (
              <button key={r.value} type="button" onClick={() => setRole(r.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  role === r.value
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : dark ? 'border-gray-600 hover:border-green-500' : 'border-gray-200 hover:border-green-400'
                }`}>
                <div className="text-2xl mb-1">{r.icon}</div>
                <div className={`font-semibold text-sm ${text}`}>{r.label}</div>
                <div className={`text-xs mt-0.5 ${sub}`}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>First Name</label>
              <input className={inp} placeholder="Amina"
                {...register('first_name', { required: 'Required' })} />
              {errors.first_name && <p className={err}>{errors.first_name.message}</p>}
            </div>
            <div>
              <label className={label}>Last Name</label>
              <input className={inp} placeholder="Uwase"
                {...register('last_name', { required: 'Required' })} />
              {errors.last_name && <p className={err}>{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={label}>Email Address</label>
            <input className={inp} type="email" placeholder="you@university.ac.rw"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }
              })} />
            {errors.email && <p className={err}>{errors.email.message}</p>}
            <p className={`text-xs mt-1 ${sub}`}>A welcome email will be sent to this address</p>
          </div>

          {/* Student ID — only for students */}
          {role === 'student' && (
            <div>
              <label className={label}>Student ID <span className={sub}>(optional)</span></label>
              <input className={inp} placeholder="UR/2024/BSC/001"
                {...register('student_id')} />
            </div>
          )}

          {/* Password */}
          <div>
            <label className={label}>Password</label>
            <input className={inp} type="password" placeholder="Min. 8 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' }
              })} />
            {errors.password && <p className={err}>{errors.password.message}</p>}
          </div>

          <div>
            <label className={label}>Confirm Password</label>
            <input className={inp} type="password" placeholder="Repeat your password"
              {...register('password2', {
                required: 'Please confirm your password',
                validate: val => val === password || 'Passwords do not match'
              })} />
            {errors.password2 && <p className={err}>{errors.password2.message}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all mt-2">
            {loading ? 'Creating account…' : `Create ${role === 'student' ? 'Student' : 'Counselor'} Account →`}
          </button>
        </form>

        <p className={`text-center text-sm mt-6 ${sub}`}>
          Already have an account?{' '}
          <Link to="/login" className="text-green-500 font-semibold hover:underline">Sign in</Link>
        </p>

        {/* Info box */}
        <div className={`mt-6 p-4 rounded-xl text-xs leading-6 border-l-4 border-green-500 ${
          dark ? 'bg-gray-700/50 text-gray-400' : 'bg-green-50 text-gray-500'
        }`}>
          <strong className="text-green-600">Your data is confidential.</strong><br />
          MindMate is a safe space. Your information is never shared without your consent.
        </div>
      </div>
    </div>
  )
}
