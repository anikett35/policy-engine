import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getEvaluation, getEvaluationStats } from '../api/endpoints'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import {
  CheckCircle, XCircle, Flag, Clock, ChevronDown, ChevronRight,
  Zap, Search, ArrowUpDown, ShieldCheck, ShieldX, AlertTriangle, BarChart2, Users
} from 'lucide-react'

const DECISION_META = {
  allow: { label: 'Eligible',     color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: ShieldCheck },
  deny:  { label: 'Not Eligible', color: '#ef4444', bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30',     icon: ShieldX },
  flag:  { label: 'Under Review', color: '#f59e0b', bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   icon: AlertTriangle },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-xs text-slate-200 shadow-xl">
      <div className="font-semibold">{payload[0].name}</div>
      <div className="text-slate-400">Count: <span className="text-white font-bold">{payload[0].value}</span></div>
    </div>
  )
}

export default function EvaluationsPage() {
  const { data: evaluations = [], isLoading } = useQuery({ queryKey: ['evaluations'], queryFn: () => getEvaluations() })
  const { data: stats } = useQuery({ queryKey: ['eval-stats'], queryFn: getEvaluationStats })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPolicy, setSelectedPolicy] = useState('all')
  const [decisionFilter, setDecisionFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

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
      if (sortBy === 'date') { va = new Date(a.evaluated_at); vb = new Date(b.evaluated_at) }
      else if (sortBy === 'decision') { va = a.final_decision; vb = b.final_decision }
      else { va = a.rules_matched; vb = b.rules_matched }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
    return list
  }, [evaluations, selectedPolicy, decisionFilter, search, sortBy, sortDir])

  const pieData = [
    { name: 'Eligible',     value: stats?.allow ?? 0, color: '#10b981' },
    { name: 'Not Eligible', value: stats?.deny  ?? 0, color: '#ef4444' },
    { name: 'Under Review', value: stats?.flag  ?? 0, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const barData = useMemo(() => {
    const map = {}
    evaluations.forEach(e => {
      if (!map[e.policy_name]) map[e.policy_name] = { name: e.policy_name, allow: 0, deny: 0, flag: 0 }
      map[e.policy_name][e.final_decision]++
    })
    return Object.values(map)
  }, [evaluations])

  const eligibleList = useMemo(() =>
    filtered.filter(e => e.final_decision === 'allow').sort((a, b) => b.rules_matched - a.rules_matched),
    [filtered]
  )

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-full text-slate-500">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading evaluations...
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Evaluation Results</h1>
          <p className="text-slate-500 text-sm">{evaluations.length} total evaluations across {policies.length} policies</p>
        </div>
        <div className="flex bg-[#0f172a] border border-[#1e293b] rounded-xl p-1 gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
            { id: 'list',      label: 'All Results', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all " +
                (activeTab === id ? 'bg-primary-500 text-white shadow' : 'text-slate-400 hover:text-white')}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Evaluated', value: stats?.total_evaluations ?? 0, icon: Zap,           color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
              { label: 'Eligible',        value: stats?.allow ?? 0,             icon: ShieldCheck,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Not Eligible',    value: stats?.deny  ?? 0,             icon: ShieldX,       color: 'text-red-400',     bg: 'bg-red-500/10'     },
              { label: 'Under Review',    value: stats?.flag  ?? 0,             icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card flex items-center gap-4">
                <div className={"w-12 h-12 " + bg + " rounded-xl flex items-center justify-center flex-shrink-0"}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-white text-sm mb-1">Decision Distribution</h3>
              <p className="text-xs text-slate-500 mb-4">Overall eligibility breakdown</p>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                        dataKey="value" stroke="none" paddingAngle={3}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-5 mt-1">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs text-slate-400">{d.name}</span>
                        <span className="text-xs font-bold text-white">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-white text-sm mb-1">Results by Policy</h3>
              <p className="text-xs text-slate-500 mb-4">Allow / Deny / Flag per policy</p>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#e2e8f0', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    <Bar dataKey="allow" name="Eligible"     fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="deny"  name="Not Eligible" fill="#ef4444" radius={[4,4,0,0]} />
                    <Bar dataKey="flag"  name="Under Review" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
              )}
            </div>
          </div>

          {/* Eligible sorted list */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white text-sm">✅ Eligible Applicants — Sorted by Best Match</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ranked by most rules passed — top candidates first</p>
              </div>
              <span className="badge badge-allow">{eligibleList.length} eligible</span>
            </div>
            {eligibleList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e293b]">
                      {['Rank','Policy','Input Data','Rules Passed','Speed','Evaluated By','Date'].map(h => (
                        <th key={h} className="text-left text-xs text-slate-500 pb-3 font-medium pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleList.map((ev, i) => (
                      <tr key={ev.id} className="border-b border-[#1e293b] hover:bg-emerald-500/5 transition-colors">
                        <td className="py-3 pr-4">
                          <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold " +
                            (i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                             i === 1 ? 'bg-slate-400/20 text-slate-300' :
                             i === 2 ? 'bg-orange-500/20 text-orange-400' :
                             'bg-[#1e293b] text-slate-500')}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-white text-xs font-medium">{ev.policy_name}</td>
                        <td className="py-3 pr-4"><EvalInputPreview evalId={ev.id} /></td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-[#1e293b] rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: ev.rules_total ? (ev.rules_matched / ev.rules_total * 100) + '%' : '0%' }} />
                            </div>
                            <span className="text-xs font-mono text-emerald-400">{ev.rules_matched}/{ev.rules_total}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs font-mono text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={11} />{ev.execution_time_ms}ms</span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-400">{ev.evaluated_by}</td>
                        <td className="py-3 text-xs text-slate-500">{new Date(ev.evaluated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                <ShieldCheck size={36} className="mx-auto mb-3 opacity-20" />
                No eligible applicants yet
              </div>
            )}
          </div>

          {/* Not Eligible */}
          {filtered.filter(e => e.final_decision === 'deny').length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-sm">❌ Not Eligible</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Applicants who did not meet the criteria</p>
                </div>
                <span className="badge badge-deny">{filtered.filter(e => e.final_decision === 'deny').length} denied</span>
              </div>
              <div className="space-y-2">
                {filtered.filter(e => e.final_decision === 'deny').map(ev => (
                  <div key={ev.id} className="flex items-center gap-4 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <ShieldX size={16} className="text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-white">{ev.policy_name}</div>
                      <div className="text-[11px] text-slate-500">{ev.rules_matched}/{ev.rules_total} rules matched</div>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(ev.evaluated_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Under Review */}
          {filtered.filter(e => e.final_decision === 'flag').length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-sm">🚩 Under Review</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Flagged for manual review</p>
                </div>
                <span className="badge badge-flag">{filtered.filter(e => e.final_decision === 'flag').length} flagged</span>
              </div>
              <div className="space-y-2">
                {filtered.filter(e => e.final_decision === 'flag').map(ev => (
                  <div key={ev.id} className="flex items-center gap-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-white">{ev.policy_name}</div>
                      <div className="text-[11px] text-slate-500">{ev.rules_matched}/{ev.rules_total} rules matched</div>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(ev.evaluated_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL RESULTS TAB */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="card flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-9 py-2" placeholder="Search policy or user..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-48 py-2" value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)}>
              <option value="all">All Policies</option>
              {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="input w-44 py-2" value={decisionFilter} onChange={e => setDecisionFilter(e.target.value)}>
              <option value="all">All Decisions</option>
              <option value="allow">Eligible</option>
              <option value="deny">Not Eligible</option>
              <option value="flag">Under Review</option>
            </select>
            <div className="text-xs text-slate-500">{filtered.length} results</div>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#0a1120]">
                  <th className="text-left text-xs text-slate-500 px-5 py-3 font-medium">Decision</th>
                  <th className="text-left text-xs text-slate-500 px-5 py-3 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('date')}>
                    <span className="flex items-center gap-1">Date <ArrowUpDown size={11} /></span>
                  </th>
                  <th className="text-left text-xs text-slate-500 px-5 py-3 font-medium">Policy</th>
                  <th className="text-left text-xs text-slate-500 px-5 py-3 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('rules')}>
                    <span className="flex items-center gap-1">Rules <ArrowUpDown size={11} /></span>
                  </th>
                  <th className="text-left text-xs text-slate-500 px-5 py-3 font-medium">Time</th>
                  <th className="text-left text-xs text-slate-500 px-5 py-3 font-medium">By</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => {
                  const meta = DECISION_META[ev.final_decision]
                  const Icon = meta?.icon
                  const isOpen = expandedId === ev.id
                  return (
                    <>
                      <tr key={ev.id} className="border-b border-[#1e293b] hover:bg-[#1a2540] transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isOpen ? null : ev.id)}>
                        <td className="px-5 py-3">
                          <div className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border " + meta?.bg + " " + meta?.text + " " + meta?.border}>
                            {Icon && <Icon size={12} />}{meta?.label}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">{new Date(ev.evaluated_at).toLocaleString()}</td>
                        <td className="px-5 py-3 text-xs text-white font-medium">{ev.policy_name}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[#1e293b] rounded-full h-1.5">
                              <div className={"h-1.5 rounded-full " + (ev.final_decision === 'allow' ? 'bg-emerald-500' : ev.final_decision === 'deny' ? 'bg-red-500' : 'bg-amber-500')}
                                style={{ width: ev.rules_total ? (ev.rules_matched / ev.rules_total * 100) + '%' : '0%' }} />
                            </div>
                            <span className="text-xs font-mono text-slate-400">{ev.rules_matched}/{ev.rules_total}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-slate-500">{ev.execution_time_ms}ms</td>
                        <td className="px-5 py-3 text-xs text-slate-400">{ev.evaluated_by}</td>
                        <td className="px-3 py-3 text-slate-500">{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
                      </tr>
                      {isOpen && (
                        <tr key={ev.id + '-d'} className="bg-[#080d18]">
                          <td colSpan={7} className="px-5 py-4"><EvalDetail evalId={ev.id} /></td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">No evaluations match your filters.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EvalInputPreview({ evalId }) {
  const { data } = useQuery({ queryKey: ['eval', evalId], queryFn: () => getEvaluation(evalId), staleTime: 60000 })
  if (!data?.input_data) return <span className="text-slate-600 text-xs">—</span>
  const entries = Object.entries(data.input_data).slice(0, 3)
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span key={k} className="text-[10px] bg-[#1e293b] text-slate-400 px-2 py-0.5 rounded font-mono">{k}={v}</span>
      ))}
      {Object.keys(data.input_data).length > 3 && (
        <span className="text-[10px] text-slate-600">+{Object.keys(data.input_data).length - 3} more</span>
      )}
    </div>
  )
}

function EvalDetail({ evalId }) {
  const { data, isLoading } = useQuery({ queryKey: ['eval', evalId], queryFn: () => getEvaluation(evalId), staleTime: 60000 })
  if (isLoading) return <div className="text-slate-500 text-xs py-2">Loading...</div>
  if (!data) return null
  return (
    <div className="grid grid-cols-2 gap-5">
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Input Data</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.input_data).map(([k, v]) => (
            <div key={k} className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2">
              <div className="text-[10px] text-slate-500 uppercase">{k}</div>
              <div className="text-sm font-semibold text-white mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Rule Breakdown</div>
        <div className="space-y-2">
          {data.results?.map((r, i) => (
            <div key={i} className={"rounded-xl p-3 border " + (r.matched ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-[#1e293b] bg-[#0f172a]')}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={"w-2 h-2 rounded-full " + (r.matched ? 'bg-emerald-500' : 'bg-slate-600')} />
                <span className="text-xs font-semibold text-white">{r.rule_name}</span>
                {r.matched && r.actions_triggered.map(a => (
                  <span key={a} className={"badge text-[10px] badge-" + (a === 'deny' ? 'deny' : a === 'flag' ? 'flag' : 'allow')}>{a}</span>
                ))}
              </div>
              {r.conditions_evaluated?.map((c, j) => (
                <div key={j} className="ml-4 flex items-center gap-2 text-[11px] font-mono mt-1">
                  <span className={c.passed ? 'text-emerald-500' : 'text-red-400'}>{c.passed ? '✓' : '✗'}</span>
                  <span className="text-slate-400">{c.field}</span>
                  <span className="text-slate-600">{c.operator}</span>
                  <span className="text-slate-300">{String(c.expected)}</span>
                  <span className="text-slate-600">→ got</span>
                  <span className={c.passed ? 'text-emerald-400' : 'text-red-400'}>{String(c.actual ?? 'null')}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}