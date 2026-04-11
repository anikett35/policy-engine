import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../api/endpoints'
import { ScrollText, PlusCircle, RefreshCw, Edit3, Trash2, Play, User } from 'lucide-react'

const ACTION_CONFIG = {
  CREATE:   { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: PlusCircle },
  UPDATE:   { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe', icon: Edit3      },
  DELETE:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: Trash2     },
  EVALUATE: { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: Play       },
}

const ENTITY_COLORS = {
  policy:     { bg: '#eef2ff', text: '#4f6ef7' },
  rule:       { bg: '#e0f2fe', text: '#0891b2' },
  evaluation: { bg: '#fef9c3', text: '#d97706' },
  user:       { bg: '#dcfce7', text: '#16a34a' },
}

// ✅ Backend IST isoformat string directly parse करतो
function timeAgo(dateStr) {
  const now = new Date()
  const past = new Date(dateStr)
  const diff = now - past
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ✅ IST time display — backend already IST पाठवतो
function formatISTTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
    timeZone: 'Asia/Kolkata'
  })
}

function formatISTDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day:      '2-digit',
    month:    'short',
    year:     'numeric',
    timeZone: 'Asia/Kolkata'
  })
}

export default function LogsPage() {
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey:        ['logs', entityFilter],
    queryFn:         () => getLogs(entityFilter || undefined),
    refetchInterval: 10000,
  })

  const filtered = actionFilter ? logs.filter(l => l.action === actionFilter) : logs

  const stats = {
    total:   logs.length,
    creates: logs.filter(l => l.action === 'CREATE').length,
    updates: logs.filter(l => l.action === 'UPDATE').length,
    deletes: logs.filter(l => l.action === 'DELETE').length,
    evals:   logs.filter(l => l.action === 'EVALUATE').length,
  }

  const SELECT_STYLE = {
    padding: '8px 12px', background: '#fff', border: '1px solid #e4e7ed',
    borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none',
  }

  return (
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Audit Logs</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Every action tracked · {logs.length} entries</p>
        </div>
        <button
          onClick={() => refetch()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#374151', border: '1px solid #e4e7ed', borderRadius: 9, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total',       value: stats.total,   bg: '#f3f4f6', text: '#374151' },
          { label: 'Created',     value: stats.creates, bg: '#dcfce7', text: '#166534' },
          { label: 'Updated',     value: stats.updates, bg: '#eef2ff', text: '#3730a3' },
          { label: 'Deleted',     value: stats.deletes, bg: '#fee2e2', text: '#991b1b' },
          { label: 'Evaluations', value: stats.evals,   bg: '#fef9c3', text: '#854d0e' },
        ].map(({ label, value, bg, text }) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: text }}>{value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{ ...SELECT_STYLE, minWidth: 170 }}>
          <option value="">All Entity Types</option>
          <option value="policy">Policies</option>
          <option value="rule">Rules</option>
          <option value="evaluation">Evaluations</option>
          <option value="user">Users</option>
        </select>

        <div style={{ display: 'flex', gap: 6 }}>
          {['', 'CREATE', 'UPDATE', 'DELETE', 'EVALUATE'].map(a => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              style={{
                fontSize: 12, padding: '7px 14px', borderRadius: 9, fontWeight: 500,
                border: '1px solid',
                borderColor: actionFilter === a ? '#4f6ef7' : '#e4e7ed',
                background:  actionFilter === a ? '#eef2ff' : '#fff',
                color:       actionFilter === a ? '#4f6ef7' : '#6b7280',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {a || 'All'}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>{filtered.length} entries</span>
      </div>

      {/* Log entries */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 56, background: '#fff', border: '1px solid #e4e7ed', borderRadius: 12, animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {filtered.map(log => {
            const cfg    = ACTION_CONFIG[log.action] || ACTION_CONFIG.CREATE
            const entCfg = ENTITY_COLORS[log.entity_type] || { bg: '#f3f4f6', text: '#374151' }
            const Icon   = cfg.icon

            return (
              <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* Icon dot */}
                <div style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color={cfg.text} />
                </div>

                {/* Card */}
                <div style={{
                  flex: 1, background: '#fff', border: '1px solid #e4e7ed',
                  borderRadius: 11, padding: '10px 16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                  {/* Action badge */}
                  <span style={{ fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, padding: '2px 8px', borderRadius: 6 }}>
                    {log.action}
                  </span>

                  {/* Entity type */}
                  <span style={{ fontSize: 10, fontWeight: 600, background: entCfg.bg, color: entCfg.text, padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize' }}>
                    {log.entity_type}
                  </span>

                  {/* Entity name */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{log.entity_name}</span>

                  <span style={{ color: '#e4e7ed' }}>·</span>

                  {/* User */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                    <User size={11} /> {log.performed_by}
                  </span>

                  {/* Details */}
                  {Object.keys(log.details || {}).length > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#9ca3af', background: '#f9fafb', padding: '2px 8px', borderRadius: 6, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {JSON.stringify(log.details)}
                    </span>
                  )}

                  {/* ✅ Time — IST Correct */}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {timeAgo(log.timestamp)}
                    <span style={{ color: '#d1d5db', marginLeft: 8 }}>
                      {formatISTDate(log.timestamp)} {formatISTTime(log.timestamp)}
                    </span>
                  </span>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <ScrollText size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontWeight: 600, color: '#6b7280', fontSize: 14, margin: '0 0 4px' }}>No audit logs yet</p>
              <p style={{ fontSize: 13, margin: 0 }}>Actions will appear here automatically</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}