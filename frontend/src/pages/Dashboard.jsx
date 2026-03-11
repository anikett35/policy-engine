import { useQuery } from '@tanstack/react-query'
import { getPolicies, getEvaluationStats, getEvaluations } from '../api/endpoints'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Shield, Activity, CheckCircle, XCircle, Flag, Clock, ArrowRight, TrendingUp, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 14px' }}>
      <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{payload[0].name}</div>
      <div style={{ color: '#94a3b8', fontSize: 11 }}>Count: <span style={{ color: '#fff', fontWeight: 700 }}>{payload[0].value}</span></div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })
  const { data: stats } = useQuery({ queryKey: ['eval-stats'], queryFn: getEvaluationStats })
  const { data: recent = [] } = useQuery({ queryKey: ['evaluations'], queryFn: () => getEvaluations() })

  const pieData = stats ? [
    { name: 'Eligible',     value: stats.allow, color: '#10b981' },
    { name: 'Not Eligible', value: stats.deny,  color: '#ef4444' },
    { name: 'Under Review', value: stats.flag,  color: '#f59e0b' },
  ].filter(d => d.value > 0) : []

  const recentTrend = recent.slice(0, 14).reverse().map((e, i) => ({
    i, allow: e.final_decision === 'allow' ? 1 : 0,
    deny: e.final_decision === 'deny' ? 1 : 0
  }))

  const statCards = [
    { label: 'Total Policies', value: policies.length, icon: Shield, gradient: 'from-blue-600 to-indigo-600', glow: 'rgba(79,110,247,0.3)', sub: 'active policies' },
    { label: 'Evaluations Run', value: stats?.total_evaluations ?? 0, icon: Activity, gradient: 'from-violet-600 to-purple-600', glow: 'rgba(139,92,246,0.3)', sub: 'total evaluated' },
    { label: 'Eligible', value: stats?.allow ?? 0, icon: CheckCircle, gradient: 'from-emerald-600 to-teal-600', glow: 'rgba(16,185,129,0.3)', sub: 'passed evaluation' },
    { label: 'Not Eligible', value: stats?.deny ?? 0, icon: XCircle, gradient: 'from-red-600 to-rose-600', glow: 'rgba(239,68,68,0.3)', sub: 'denied' },
    { label: 'Under Review', value: stats?.flag ?? 0, icon: Flag, gradient: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.3)', sub: 'flagged' },
    { label: 'Avg Speed', value: (stats?.avg_execution_ms ?? 0) + 'ms', icon: Clock, gradient: 'from-cyan-600 to-sky-600', glow: 'rgba(6,182,212,0.3)', sub: 'per evaluation' },
  ]

  return (
    <div className="p-7 space-y-6 animate-fade-up">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, <span className="gradient-text">{user?.username}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Here's what's happening in your PolicyEngine today.</p>
        </div>
        <Link to="/bulk-evaluate" className="btn-primary">
          <Zap size={15} /> Run Evaluation
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {statCards.map(({ label, value, icon: Icon, gradient, glow, sub }) => (
          <div key={label} className="stat-card animate-fade-up"
            style={{ background: 'linear-gradient(135deg, rgba(15,25,45,0.95) 0%, rgba(8,15,30,0.98) 100%)' }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }} />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-bold text-white tracking-tight mb-1">{value}</div>
                <div className="text-sm font-semibold text-slate-300">{label}</div>
                <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
              </div>
              <div className={"w-11 h-11 rounded-2xl bg-gradient-to-br " + gradient + " flex items-center justify-center flex-shrink-0"}
                style={{ boxShadow: `0 0 20px ${glow}` }}>
                <Icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-5 gap-4">

        {/* Pie chart — 2 cols */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">Decision Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Eligibility breakdown</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-indigo-400" />
            </div>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" stroke="none" paddingAngle={4}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-3 justify-center mt-3 flex-wrap">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                    <span className="text-xs text-slate-400">{d.name}</span>
                    <span className="text-xs font-bold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-600">
              <Activity size={32} className="mb-2 opacity-40" />
              <p className="text-xs">No evaluations yet</p>
            </div>
          )}
        </div>

        {/* Area trend — 3 cols */}
        <div className="col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">Evaluation Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Recent evaluation history</p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
              Last {recentTrend.length} evals
            </span>
          </div>
          {recentTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={recentTrend}>
                <defs>
                  <linearGradient id="gAllow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDeny" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis hide />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }} />
                <Area type="monotone" dataKey="allow" name="Eligible" stroke="#10b981" strokeWidth={2} fill="url(#gAllow)" />
                <Area type="monotone" dataKey="deny"  name="Denied"   stroke="#ef4444" strokeWidth={2} fill="url(#gDeny)"  />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-600">
              <Activity size={32} className="mb-2 opacity-40" />
              <p className="text-xs">Run evaluations to see trend</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Recent evaluations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">Recent Evaluations</h3>
            <Link to="/evaluations" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {recent.slice(0, 5).map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 " +
                  (ev.final_decision === 'allow' ? 'bg-emerald-500/15' : ev.final_decision === 'deny' ? 'bg-red-500/15' : 'bg-amber-500/15')}>
                  {ev.final_decision === 'allow' ? <CheckCircle size={13} className="text-emerald-400" />
                    : ev.final_decision === 'deny' ? <XCircle size={13} className="text-red-400" />
                    : <Flag size={13} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{ev.policy_name}</div>
                  <div className="text-[10px] text-slate-600">{ev.rules_matched}/{ev.rules_total} rules · {ev.execution_time_ms}ms</div>
                </div>
                <span className={"badge badge-" + ev.final_decision}>{ev.final_decision}</span>
              </div>
            ))}
            {recent.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-xs">
                No evaluations yet. <Link to="/bulk-evaluate" className="text-indigo-400">Run one →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Policies */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">Your Policies</h3>
            <Link to="/policies" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Manage <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {policies.slice(0, 5).map(p => (
              <Link key={p.id} to={"/policies/" + p.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield size={13} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{p.name}</div>
                  <div className="text-[10px] text-slate-600">{p.category} · v{p.version}</div>
                </div>
                <span className={"badge badge-" + p.status}>{p.status}</span>
              </Link>
            ))}
            {policies.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-xs">
                No policies yet. <Link to="/policies" className="text-indigo-400">Create one →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}