import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { authApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'

const LANG_NAMES = { en: 'English', fr: 'Français', rw: 'Kinyarwanda' }

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { theme, toggleTheme, cycleLang, t, lang } = useTheme()
  const dark = theme === 'dark'

  const { register, handleSubmit } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name:  user?.last_name  || '',
      phone:      user?.phone      || '',
      bio:        user?.bio        || '',
    },
  })

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, watch: watchPwd, formState: { errors: pwdErrors } } = useForm()
  const newPwd = watchPwd('new_password')

  const profileMut = useMutation(
    data => authApi.updateMe(data).then(r => r.data),
    {
      onSuccess: data => { updateUser(data); toast.success('Profile updated! ✅') },
      onError: () => toast.error('Error updating profile.'),
    }
  )

  const pwdMut = useMutation(
    data => authApi.changePassword(data),
    {
      onSuccess: () => { toast.success('Password changed!'); resetPwd() },
      onError: err => toast.error(err.response?.data?.old_password?.[0] || 'Error changing password.'),
    }
  )

  const borderColor = dark ? '#3A4E3E' : '#EDF2F7'
  const textMuted = dark ? '#7A9070' : '#A0AEC0'

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
          {t('profile')}
        </h1>
        <p style={{ fontSize: 13, color: textMuted }}>Manage your personal information and preferences</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: dark ? '#2E4035' : '#EBF3EC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', serif", fontSize: 24,
            color: '#6B8F71', fontWeight: 600, flexShrink: 0,
            border: '2px solid #A8C5AC'
          }}>
            {user?.initials}
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 3 }}>{user?.full_name}</div>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 8 }}>{user?.email}</div>
            <span className={`badge badge-${user?.role}`} style={{ textTransform: 'capitalize' }}>{t(user?.role)}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Personal Information</div>
          <form onSubmit={handleSubmit(d => profileMut.mutate(d))}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name</label>
                <input className="form-input" {...register('first_name')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Last Name</label>
                <input className="form-input" {...register('last_name')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+250 7XX XXX XXX" {...register('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} placeholder="A few words about yourself…" {...register('bio')} />
            </div>
            <button type="submit" disabled={profileMut.isLoading} className="btn btn-primary btn-sm">
              {profileMut.isLoading ? '⏳ Saving…' : '💾 Save Changes'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Change Password</div>
          <form onSubmit={handlePwd(d => pwdMut.mutate({ old_password: d.old_password, new_password: d.new_password }))}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" {...regPwd('old_password', { required: 'Required' })} />
                {pwdErrors.old_password && <p className="form-error">{pwdErrors.old_password.message}</p>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" {...regPwd('new_password', { required: 'Required', minLength: { value: 8, message: 'Minimum 8 characters' } })} />
                {pwdErrors.new_password && <p className="form-error">{pwdErrors.new_password.message}</p>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" {...regPwd('confirm', { validate: v => v === newPwd || 'Passwords do not match' })} />
                {pwdErrors.confirm && <p className="form-error">{pwdErrors.confirm.message}</p>}
              </div>
            </div>
            <button type="submit" disabled={pwdMut.isLoading} className="btn btn-outline btn-sm">
              {pwdMut.isLoading ? '⏳ Updating…' : '🔐 Update Password'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Preferences</div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${borderColor}` }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Interface Language</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{t('flag')} {LANG_NAMES[lang]}</div>
              </div>
              <button onClick={cycleLang} className="btn btn-outline btn-sm">Change Language</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Display Theme</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{dark ? '🌙 Dark Mode' : '☀️ Light Mode'}</div>
              </div>
              <button onClick={toggleTheme} className="btn btn-outline btn-sm">
                {dark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
