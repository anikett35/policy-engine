import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRules, getPolicies } from '../api/endpoints'
import { Link } from 'react-router-dom'
import { Layers, ArrowRight, CheckCircle, XCircle, Flag } from 'lucide-react'

const DECISION_META = {
  allow:  { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: CheckCircle },
  deny:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: XCircle    },
  flag:   { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: Flag       },
}

export default function RulesPage() {
  const { data: rules    = [], isLoading } = useQuery({ queryKey: ['rules'],    queryFn: () => getRules()    })
  const { data: policies = [] }             = useQuery({ queryKey: ['policies'], queryFn: getPolicies         })

  const [filter, setFilter] = useState('')

  const policyMap = Object.fromEntries(policies.map(p => [p.id, p.name]))
  const filtered  = filter ? rules.filter(r => r.policy_id === filter) : rules
  const sorted    = [...filtered].sort((a, b) => a.priority - b.priority)

  return (
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>All Rules</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
            {filtered.length} rule{filtered.length !== 1 ? 's' : ''}{filter ? ` in selected policy` : ' across all policies'}
          </p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '9px 12px', background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, fontSize: 13, color: '#374151', outline: 'none', minWidth: 220 }}
        >
          <option value="">All Policies</option>
          {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, background: '#fff', border: '1px solid #e4e7ed', borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map(r => {
            const actionType = r.actions?.[0]?.type
            const meta       = DECISION_META[actionType] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed', icon: null }
            const ActionIcon = meta.icon

            return (
              <div
                key={r.id}
                style={{
                  background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14,
                  padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
              >
                {/* Priority badge */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: meta.bg, border: `1px solid ${meta.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: meta.text,
                }}>
                  {r.priority}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: r.is_active ? '#dcfce7' : '#f3f4f6',
                      color:      r.is_active ? '#166534' : '#6b7280',
                    }}>
                      {r.is_active ? 'active' : 'inactive'}
                    </span>
                    <span style={{ fontSize: 10, background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: 20 }}>
                      {r.logic}
                    </span>
                  </div>

                  {/* Policy link */}
                  {policyMap[r.policy_id] && (
                    <Link
                      to={`/policies/${r.policy_id}`}
                      style={{ fontSize: 12, color: '#4f6ef7', textDecoration: 'none', display: 'inline-block', marginBottom: 8 }}
                    >
                      {policyMap[r.policy_id]}
                    </Link>
                  )}

                  {/* Conditions + action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {r.conditions?.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11, fontFamily: 'monospace', padding: '4px 10px', borderRadius: 8,
                          background: '#f9fafb', color: '#374151', border: '1px solid #f3f4f6',
                        }}
                      >
                        <span style={{ color: '#4f6ef7' }}>{c.field}</span>
                        <span style={{ color: '#9ca3af', margin: '0 4px' }}>{c.operator}</span>
                        <span style={{ fontWeight: 700 }}>{c.value}</span>
                      </span>
                    ))}

                    {r.conditions?.length > 0 && (
                      <ArrowRight size={12} color="#d1d5db" />
                    )}

                    {r.actions?.map((a, i) => {
                      const am = DECISION_META[a.type] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed', icon: null }
                      const AIcon = am.icon
                      return (
                        <span
                          key={i}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                            background: am.bg, color: am.text, border: `1px solid ${am.border}`,
                          }}
                        >
                          {AIcon && <AIcon size={11} />} {a.type.toUpperCase()}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <Layers size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontWeight: 600, color: '#6b7280', fontSize: 14, margin: '0 0 4px' }}>No rules found</p>
              <p style={{ fontSize: 13, margin: 0 }}>
                {filter ? 'This policy has no rules yet.' : 'Create a policy and add rules to get started.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}