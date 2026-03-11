import { useQuery } from '@tanstack/react-query'
import { getRules, getPolicies } from '../api/endpoints'
import { Link } from 'react-router-dom'
import { Layers, ArrowRight } from 'lucide-react'
import { useState } from 'react'

export default function RulesPage() {
  const { data: rules = [], isLoading } = useQuery({ queryKey: ['rules'], queryFn: () => getRules() })
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })
  const [filter, setFilter] = useState('')

  const policyMap = Object.fromEntries(policies.map(p => [p.id, p.name]))
  const filtered = filter ? rules.filter(r => r.policy_id === filter) : rules

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">All Rules</h1>
          <p className="text-slate-500 text-sm">{filtered.length} rules</p>
        </div>
        <select className="input w-56" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Policies</option>
          {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center text-xs font-bold text-slate-400 mt-0.5">
                  #{r.priority}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{r.name}</span>
                    <span className={`badge ${r.is_active ? 'badge-active' : 'badge-draft'}`}>
                      {r.is_active ? 'active' : 'inactive'}
                    </span>
                    <span className="text-xs text-slate-600">· logic: {r.logic}</span>
                  </div>
                  {policyMap[r.policy_id] && (
                    <Link to={`/policies/${r.policy_id}`} className="text-xs text-primary-400 hover:text-primary-300 mb-1 block">
                      Policy: {policyMap[r.policy_id]}
                    </Link>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {r.conditions?.map((c, i) => (
                      <span key={i} className="text-[11px] bg-[#111827] text-slate-400 px-2.5 py-1 rounded-lg font-mono">
                        {c.field} {c.operator} {c.value}
                      </span>
                    ))}
                    <ArrowRight size={13} className="text-slate-600 self-center" />
                    {r.actions?.map((a, i) => (
                      <span key={i} className={`badge badge-${a.type === 'deny' ? 'deny' : a.type === 'flag' ? 'flag' : 'allow'}`}>
                        {a.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Layers size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No rules found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
