import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, Shield, Activity, CheckCircle } from 'lucide-react'

const FEATURES = [
  { icon: Shield,      text: 'Policy Rule Engine'   },
  { icon: Activity,    text: 'Bulk CSV Evaluation'  },
  { icon: CheckCircle, text: 'Real-time Results'    },
]

const INPUT_STYLE = {
  width: '100%', padding: '10px 14px', background: '#f9fafb',
  border: '1px solid #e4e7ed', borderRadius: 10, fontSize: 14,
  color: '#111827', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export default function LoginPage() {
  const [mode,    setMode]    = useState('login')
  const [form,    setForm]    = useState({ username: '', email: '', password: '', role: 'analyst' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.username, form.email, form.password, form.role)
      toast.success('Welcome to PolicyEngine!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8f9fb' }}>

      {/* ── Left panel ── */}
      <div style={{
        width: '44%', flexShrink: 0,
        background: 'linear-gradient(160deg, #3d5af1 0%, #5b3ff8 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>PolicyEngine</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Rule Evaluation System</div>
          </div>
        </div>

        {/* Hero */}
        <div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 18px', letterSpacing: '-0.5px' }}>
            Evaluate Rules.<br />Make Decisions.<br />At Scale.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.65, margin: '0 0 32px', maxWidth: 320 }}>
            Upload CSV files, define policies with conditions, and instantly get eligibility results for hundreds of applicants.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="#fff" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 36 }}>
          {[['10+', 'Operators'], ['3', 'Decision Types'], ['Unlimited', 'Evaluations']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Card */}
          <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 18, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
                {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
              </h1>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  style={{ background: 'none', border: 'none', color: '#4f6ef7', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}
                >
                  {mode === 'login' ? 'Register' : 'Sign in'}
                </button>
              </p>
            </div>

            <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Username</label>
                  <input
                    style={INPUT_STYLE}
                    placeholder="johndoe"
                    value={form.username}
                    onChange={e => update('username', e.target.value)}
                    required
                    onFocus={e => e.target.style.borderColor = '#a5b4fc'}
                    onBlur={e  => e.target.style.borderColor = '#e4e7ed'}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
                <input
                  style={INPUT_STYLE}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  required
                  onFocus={e => e.target.style.borderColor = '#a5b4fc'}
                  onBlur={e  => e.target.style.borderColor = '#e4e7ed'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...INPUT_STYLE, paddingRight: 44 }}
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    required
                    onFocus={e => e.target.style.borderColor = '#a5b4fc'}
                    onBlur={e  => e.target.style.borderColor = '#e4e7ed'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Role</label>
                  <select
                    value={form.role}
                    onChange={e => update('role', e.target.value)}
                    style={{ ...INPUT_STYLE }}
                    onFocus={e => e.target.style.borderColor = '#a5b4fc'}
                    onBlur={e  => e.target.style.borderColor = '#e4e7ed'}
                  >
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: '#4f6ef7', color: '#fff', border: 'none',
                  borderRadius: 11, padding: '13px', fontSize: 14, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.65 : 1, transition: 'opacity 0.15s', marginTop: 4,
                }}
              >
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Please wait…</>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}