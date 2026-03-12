import { useQuery } from '@tanstack/react-query'
import { getPolicies, getEvaluationStats, getEvaluations } from '../api/endpoints'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts'
import {
  Shield, Activity, CheckCircle, XCircle, Flag,
  Clock, ArrowRight, TrendingUp, Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const PIE_COLORS = ['#16a34a', '#dc2626', '#d97706']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #e4e7ed',
      borderRadius: 10, padding: '8px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>{payload[0].name}</p>
      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
        Count: <span style={{ fontWeight: 700, color: '#111827' }}>{payload[0].value}</span>
      </p>
    </div>
  )
}

const DECISION_STYLES = {
  allow: { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  deny:  { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  flag:  { bg: '#fef9c3', text: '#854d0e', dot: '#d97706' },
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })
  const { data: stats } = useQuery({ queryKey: ['eval-stats'], queryFn: getEvaluationStats })
  const { data: recent = [] } = useQuery({ queryKey: ['evaluations'], queryFn: () => getEvaluations() })

  const pieData = stats ? [
    { name: 'Eligible',     value: stats.allow, color: PIE_COLORS[0] },
    { name: 'Not Eligible', value: stats.deny,  color: PIE_COLORS[1] },
    { name: 'Under Review', value: stats.flag,  color: PIE_COLORS[2] },
  ].filter(d => d.value > 0) : []

  const recentTrend = recent.slice(0, 14).reverse().map((e, i) => ({
    i,
    allow: e.final_decision === 'allow' ? 1 : 0,
    deny:  e.final_decision === 'deny'  ? 1 : 0,
  }))

  const statCards = [
    { label: 'Total Policies',  value: policies.length,            icon: Shield,       accent: '#4f6ef7', light: '#eef2ff' },
    { label: 'Evaluations Run', value: stats?.total_evaluations ?? 0, icon: Activity,  accent: '#7c3aed', light: '#f5f3ff' },
    { label: 'Eligible',        value: stats?.allow ?? 0,           icon: CheckCircle, accent: '#16a34a', light: '#dcfce7' },
    { label: 'Not Eligible',    value: stats?.deny ?? 0,            icon: XCircle,     accent: '#dc2626', light: '#fee2e2' },
    { label: 'Under Review',    value: stats?.flag ?? 0,            icon: Flag,        accent: '#d97706', light: '#fef9c3' },
    { label: 'Avg Speed',       value: `${stats?.avg_execution_ms ?? 0}ms`, icon: Clock, accent: '#0891b2', light: '#e0f2fe' },
  ]

  return (
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
            Welcome back, <span style={{ color: '#4f6ef7' }}>{user?.username}</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4, margin: '4px 0 0' }}>
            Here's your PolicyEngine overview.
          </p>
        </div>
        <Link to="/bulk-evaluate" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#4f6ef7', color: '#fff', textDecoration: 'none',
          borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600,
        }}>
          <Zap size={14} /> Run Evaluation
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {statCards.map(({ label, value, icon: Icon, accent, light }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14,
            padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: light, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={20} color={accent} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 16, marginBottom: 20 }}>

        {/* Pie */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Decision Overview</h3>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Eligibility breakdown</p>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} color="#4f6ef7" />
            </div>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72}
                    dataKey="value" stroke="none" paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{d.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d1d5db' }}>
              <Activity size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p style={{ fontSize: 12, margin: 0 }}>No evaluations yet</p>
            </div>
          )}
        </div>

        {/* Area chart */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Evaluation Trend</h3>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Recent evaluation history</p>
            </div>
            {recentTrend.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px' }}>
                Last {recentTrend.length} evals
              </span>
            )}
          </div>
          {recentTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={recentTrend}>
                <defs>
                  <linearGradient id="gAllow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDeny" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis hide />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="allow" name="Eligible" stroke="#16a34a" strokeWidth={2} fill="url(#gAllow)" />
                <Area type="monotone" dataKey="deny"  name="Denied"   stroke="#dc2626" strokeWidth={2} fill="url(#gDeny)"  />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d1d5db' }}>
              <Activity size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p style={{ fontSize: 12, margin: 0 }}>Run evaluations to see trend</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent evaluations */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Recent Evaluations</h3>
            <Link to="/evaluations" style={{ fontSize: 12, color: '#4f6ef7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {recent.slice(0, 5).map(ev => {
              const ds = DECISION_STYLES[ev.final_decision] || DECISION_STYLES.allow
              const DecIcon = ev.final_decision === 'allow' ? CheckCircle : ev.final_decision === 'deny' ? XCircle : Flag
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid #f3f4f6', background: '#fafafa' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: ds.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DecIcon size={13} color={ds.text} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.policy_name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{ev.rules_matched}/{ev.rules_total} rules · {ev.execution_time_ms}ms</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, background: ds.bg, color: ds.text, padding: '3px 9px', borderRadius: 7, flexShrink: 0 }}>
                    {ev.final_decision}
                  </span>
                </div>
              )
            })}
            {recent.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '24px 0' }}>
                No evaluations yet.{' '}
                <Link to="/bulk-evaluate" style={{ color: '#4f6ef7', textDecoration: 'none' }}>Run one</Link>
              </p>
            )}
          </div>
        </div>

        {/* Policies */}
        <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Your Policies</h3>
            <Link to="/policies" style={{ fontSize: 12, color: '#4f6ef7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {policies.slice(0, 5).map(p => (
              <Link key={p.id} to={`/policies/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: '1px solid #f3f4f6', background: '#fafafa', textDecoration: 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={13} color="#4f6ef7" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.category} · v{p.version}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7,
                  background: p.status === 'active' ? '#dcfce7' : '#f3f4f6',
                  color: p.status === 'active' ? '#166534' : '#6b7280',
                }}>
                  {p.status}
                </span>
              </Link>
            ))}
            {policies.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '24px 0' }}>
                No policies yet.{' '}
                <Link to="/policies" style={{ color: '#4f6ef7', textDecoration: 'none' }}>Create one</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}