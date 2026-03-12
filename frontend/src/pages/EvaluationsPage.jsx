import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getEvaluation, getEvaluationStats } from '../api/endpoints'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  CheckCircle, XCircle, Flag, Clock, ChevronDown, ChevronRight,
  Zap, Search, ArrowUpDown, ShieldCheck, ShieldX, AlertTriangle,
  BarChart2, Users,
} from 'lucide-react'

const DECISION_META = {
  allow: { label: 'Eligible',     color: '#16a34a', bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: ShieldCheck  },
  deny:  { label: 'Not Eligible', color: '#dc2626', bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: ShieldX       },
  flag:  { label: 'Under Review', color: '#d97706', bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: AlertTriangle },
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>{payload[0].name}</p>
      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Count: <strong style={{ color: '#111827' }}>{payload[0].value}</strong></p>
    </div>
  )
}

export default function EvaluationsPage() {
  const { data: evaluations = [], isLoading } = useQuery({ queryKey: ['evaluations'], queryFn: () => getEvaluations() })
  const { data: stats } = useQuery({ queryKey: ['eval-stats'], queryFn: getEvaluationStats })

  const [activeTab,      setActiveTab]      = useState('dashboard')
  const [selectedPolicy, setSelectedPolicy] = useState('all')
  const [decisionFilter, setDecisionFilter] = useState('all')
  const [sortBy,         setSortBy]         = useState('date')
  const [sortDir,        setSortDir]        = useState('desc')
  const [search,         setSearch]         = useState('')
  const [expandedId,     setExpandedId]     = useState(null)

  const policies = useMemo(() => {
    const map = {}
    evaluations.forEach(e => { map[e.policy_id] = e.policy_name })
    return Object.entries(map).map(([id, name]) => ({ id, name }))
  }, [evaluations])

  const filtered = useMemo(() => {
    let list = [...evaluations]
    if (selectedPolicy !== 'all') list = list.filter(e => e.policy_id === selectedPolicy)
    if (decisionFilter !== 'all') list = list.filter(e => e.final_decision === decisionFilter)
    if (search) list = list.filter(e =>
      e.policy_name.toLowerCase().includes(search.toLowerCase()) ||
      e.evaluated_by.toLowerCase().includes(search.toLowerCase())
    )
    list.sort((a, b) => {
      let va, vb
      if (sortBy === 'date')     { va = new Date(a.evaluated_at); vb = new Date(b.evaluated_at) }
      else if (sortBy === 'decision') { va = a.final_decision; vb = b.final_decision }
      else { va = a.rules_matched; vb = b.rules_matched }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
    return list
  }, [evaluations, selectedPolicy, decisionFilter, search, sortBy, sortDir])

  const pieData = [
    { name: 'Eligible',     value: stats?.allow ?? 0, color: '#16a34a' },
    { name: 'Not Eligible', value: stats?.deny  ?? 0, color: '#dc2626' },
    { name: 'Under Review', value: stats?.flag  ?? 0, color: '#d97706' },
  ].filter(d => d.value > 0)

  const barData = useMemo(() => {
    const map = {}
    evaluations.forEach(e => {
      if (!map[e.policy_name]) map[e.policy_name] = { name: e.policy_name, allow: 0, deny: 0, flag: 0 }
      map[e.policy_name][e.final_decision]++
    })
    return Object.values(map)
  }, [evaluations])

  const toggleSort = field => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const CARD = { background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, color: '#6b7280', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #4f6ef7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        Loading evaluations…
      </div>
    </div>
  )

  return (
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Evaluation Results</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
            {evaluations.length} total evaluations across {policies.length} policies
          </p>
        </div>
        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#f3f4f6', border: '1px solid #e4e7ed', borderRadius: 11, padding: 4, gap: 4 }}>
          {[{ id: 'dashboard', label: 'Dashboard', icon: BarChart2 }, { id: 'list', label: 'All Results', icon: Users }].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                background: activeTab === id ? '#fff' : 'transparent',
                color: activeTab === id ? '#111827' : '#6b7280',
                boxShadow: activeTab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD TAB ── */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Evaluated', value: stats?.total_evaluations ?? 0, icon: Zap,           bg: '#eef2ff', color: '#4f6ef7' },
              { label: 'Eligible',        value: stats?.allow ?? 0,             icon: ShieldCheck,   bg: '#dcfce7', color: '#16a34a' },
              { label: 'Not Eligible',    value: stats?.deny  ?? 0,             icon: ShieldX,       bg: '#fee2e2', color: '#dc2626' },
              { label: 'Under Review',    value: stats?.flag  ?? 0,             icon: AlertTriangle, bg: '#fef9c3', color: '#d97706' },
            ].map(({ label, value, icon: Icon, bg, color }) => (
              <div key={label} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={CARD}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Decision Distribution</h3>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 16px' }}>Overall eligibility breakdown</p>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={86} dataKey="value" stroke="none" paddingAngle={3}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap', marginTop: 8 }}>
                    {pieData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color }} />
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{d.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>No data yet</div>
              )}
            </div>

            <div style={CARD}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Results by Policy</h3>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 16px' }}>Allow / Deny / Flag per policy</p>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
                    <Bar dataKey="allow" name="Eligible"     fill="#16a34a" radius={[4,4,0,0]} />
                    <Bar dataKey="deny"  name="Not Eligible" fill="#dc2626" radius={[4,4,0,0]} />
                    <Bar dataKey="flag"  name="Under Review" fill="#d97706" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>No data yet</div>
              )}
            </div>
          </div>

          {/* Eligible table */}
          {filtered.filter(e => e.final_decision === 'allow').length > 0 && (
            <div style={CARD}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>Eligible Applicants</h3>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Ranked by most rules passed</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
                  {filtered.filter(e => e.final_decision === 'allow').length} eligible
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {['Rank', 'Policy', 'Rules Passed', 'Speed', 'Evaluated By', 'Date'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.filter(e => e.final_decision === 'allow').sort((a, b) => b.rules_matched - a.rules_matched).map((ev, i) => (
                      <tr key={ev.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                            background: i === 0 ? '#fef9c3' : i === 1 ? '#f3f4f6' : i === 2 ? '#fed7aa' : '#f9fafb',
                            color: i === 0 ? '#854d0e' : i === 1 ? '#374151' : i === 2 ? '#7c2d12' : '#6b7280',
                          }}>{i + 1}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{ev.policy_name}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 64, background: '#f3f4f6', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                              <div style={{ width: ev.rules_total ? `${(ev.rules_matched/ev.rules_total)*100}%` : '0%', height: '100%', background: '#16a34a', borderRadius: 99 }} />
                            </div>
                            <span style={{ fontFamily: 'monospace', color: '#16a34a', fontWeight: 600 }}>{ev.rules_matched}/{ev.rules_total}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {ev.execution_time_ms}ms
                        </td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>{ev.evaluated_by}</td>
                        <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{new Date(ev.evaluated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LIST TAB ── */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Filters */}
          <div style={{ ...CARD, display: 'flex', gap: 10, flexWrap: 'wrap', padding: '14px 16px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search policy or user…"
                style={{ width: '100%', paddingLeft: 32, padding: '8px 12px 8px 32px', background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <select value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)} style={{ padding: '8px 12px', background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', minWidth: 180 }}>
              <option value="all">All Policies</option>
              {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={decisionFilter} onChange={e => setDecisionFilter(e.target.value)} style={{ padding: '8px 12px', background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', minWidth: 150 }}>
              <option value="all">All Decisions</option>
              <option value="allow">Eligible</option>
              <option value="deny">Not Eligible</option>
              <option value="flag">Under Review</option>
            </select>
            <span style={{ fontSize: 12, color: '#9ca3af', alignSelf: 'center', marginLeft: 4 }}>{filtered.length} results</span>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Decision</th>
                  <th onClick={() => toggleSort('date')} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Date <ArrowUpDown size={10} /></span>
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Policy</th>
                  <th onClick={() => toggleSort('rules')} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Rules <ArrowUpDown size={10} /></span>
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Time</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>By</th>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => {
                  const meta   = DECISION_META[ev.final_decision]
                  const Icon   = meta?.icon
                  const isOpen = expandedId === ev.id
                  return (
                    <>
                      <tr
                        key={ev.id}
                        onClick={() => setExpandedId(isOpen ? null : ev.id)}
                        style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: meta?.bg, color: meta?.text, border: `1px solid ${meta?.border}` }}>
                            {Icon && <Icon size={11} />} {meta?.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', color: '#6b7280' }}>{new Date(ev.evaluated_at).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>{ev.policy_name}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 48, background: '#f3f4f6', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                              <div style={{ width: ev.rules_total ? `${(ev.rules_matched/ev.rules_total)*100}%` : '0%', height: '100%', background: meta?.color, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontFamily: 'monospace', color: '#6b7280', fontSize: 11 }}>{ev.rules_matched}/{ev.rules_total}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#9ca3af' }}>{ev.execution_time_ms}ms</td>
                        <td style={{ padding: '10px 16px', color: '#6b7280' }}>{ev.evaluated_by}</td>
                        <td style={{ padding: '10px 16px', color: '#9ca3af' }}>
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${ev.id}-detail`}>
                          <td colSpan={7} style={{ padding: '0 16px 14px', background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                            <EvalDetail evalId={ev.id} />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>No evaluations match your filters.</div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function EvalDetail({ evalId }) {
  const { data, isLoading } = useQuery({ queryKey: ['eval', evalId], queryFn: () => getEvaluation(evalId), staleTime: 60000 })
  if (isLoading) return <p style={{ fontSize: 12, color: '#9ca3af', padding: '12px 0' }}>Loading…</p>
  if (!data) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '14px 0' }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Input Data</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(data.input_data).map(([k, v]) => (
            <div key={k} style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 9, padding: '7px 12px' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Rule Breakdown</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.results?.map((r, i) => (
            <div key={i} style={{ borderRadius: 9, padding: '10px 12px', border: `1px solid ${r.matched ? '#bbf7d0' : '#e4e7ed'}`, background: r.matched ? '#f0fdf4' : '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.matched ? '#16a34a' : '#d1d5db', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{r.rule_name}</span>
                {r.matched && r.actions_triggered.map(a => (
                  <span key={a} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: DECISION_META[a]?.bg || '#f3f4f6', color: DECISION_META[a]?.text || '#374151' }}>{a}</span>
                ))}
              </div>
              {r.conditions_evaluated?.map((c, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16, fontSize: 11, fontFamily: 'monospace', marginTop: 3 }}>
                  <span style={{ color: c.passed ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{c.passed ? '✓' : '✗'}</span>
                  <span style={{ color: '#6b7280' }}>{c.field}</span>
                  <span style={{ color: '#9ca3af' }}>{c.operator}</span>
                  <span style={{ color: '#374151' }}>{String(c.expected)}</span>
                  <span style={{ color: '#d1d5db' }}>→</span>
                  <span style={{ fontWeight: 600, color: c.passed ? '#16a34a' : '#dc2626' }}>{String(c.actual ?? 'null')}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}