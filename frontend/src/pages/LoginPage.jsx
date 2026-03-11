import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, Shield, Activity, CheckCircle } from 'lucide-react'

const features = [
  { icon: Shield, text: 'Policy Rule Engine' },
  { icon: Activity, text: 'Bulk CSV Evaluation' },
  { icon: CheckCircle, text: 'Real-time Results' },
]

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'analyst' })
  const [show, setShow] = useState(false)
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
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-grid" style={{ background: '#04080f' }}>

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div style={{ position:'absolute', top:'10%', left:'20%', width:400, height:400, background:'radial-gradient(circle, rgba(79,110,247,0.12) 0%, transparent 70%)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', bottom:'20%', right:'10%', width:300, height:300, background:'radial-gradient(circle, rgba(108,61,232,0.1) 0%, transparent 70%)', borderRadius:'50%' }} />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#4f6ef7,#6c3de8)', boxShadow:'0 0 24px rgba(79,110,247,0.5)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-lg">PolicyEngine</div>
            <div className="text-xs text-slate-600 uppercase tracking-widest">Rule Evaluation System</div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Evaluate Rules.<br />
            <span className="gradient-text">Make Decisions.</span><br />
            At Scale.
          </h2>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            Upload CSV files, define policies with conditions, and instantly get eligibility results for hundreds of applicants.
          </p>
          <div className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-500/10">
                  <Icon size={14} className="text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat */}
        <div className="relative z-10 flex gap-8">
          {[['10+', 'Operators'], ['3', 'Decision Types'], ['∞', 'Evaluations']].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold gradient-text">{v}</div>
              <div className="text-xs text-slate-600">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#4f6ef7,#6c3de8)', boxShadow:'0 0 24px rgba(79,110,247,0.4)' }}>
              <Zap size={20} className="text-white" />
            </div>
            <div className="font-bold text-white text-xl">PolicyEngine</div>
          </div>

          {/* Card */}
          <div className="relative rounded-3xl p-8"
            style={{
              background:'linear-gradient(135deg, rgba(15,25,50,0.95) 0%, rgba(8,15,30,0.98) 100%)',
              border:'1px solid rgba(255,255,255,0.07)',
              boxShadow:'0 0 0 1px rgba(79,110,247,0.1), 0 32px 64px rgba(0,0,0,0.5)'
            }}>

            {/* Top glow line */}
            <div className="absolute top-0 left-8 right-8 h-px rounded-full"
              style={{ background:'linear-gradient(90deg, transparent, rgba(79,110,247,0.5), transparent)' }} />

            <div className="mb-7">
              <h1 className="text-xl font-bold text-white mb-1">
                {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
              </h1>
              <p className="text-slate-500 text-sm">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  {mode === 'login' ? 'Register' : 'Sign in'}
                </button>
              </p>
            </div>

            <form onSubmit={handle} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Username</label>
                  <input className="input" placeholder="johndoe" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input className="input pr-11" type={show ? 'text' : 'password'} placeholder="••••••••"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Role</label>
                  <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:'linear-gradient(135deg, #4f6ef7, #6c3de8)',
                    boxShadow: loading ? 'none' : '0 0 24px rgba(79,110,247,0.4), 0 1px 0 rgba(255,255,255,0.1) inset'
                  }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Please wait...
                    </span>
                  ) : mode === 'login' ? 'Sign In →' : 'Create Account →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}