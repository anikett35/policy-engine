import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../api/endpoints'
import { ScrollText, PlusCircle, RefreshCw, Edit3, Trash2, Play, User } from 'lucide-react'

const ACTION_CONFIG = {
  CREATE:   { icon: PlusCircle, bg:'rgba(16,185,129,0.1)',  text:'#34d399', border:'rgba(16,185,129,0.2)',  label:'CREATE'   },
  UPDATE:   { icon: Edit3,      bg:'rgba(99,102,241,0.1)',  text:'#a5b4fc', border:'rgba(99,102,241,0.2)',  label:'UPDATE'   },
  DELETE:   { icon: Trash2,     bg:'rgba(239,68,68,0.1)',   text:'#f87171', border:'rgba(239,68,68,0.2)',   label:'DELETE'   },
  EVALUATE: { icon: Play,       bg:'rgba(245,158,11,0.1)',  text:'#fbbf24', border:'rgba(245,158,11,0.2)',  label:'EVALUATE' },
}

const ENTITY_COLORS = {
  policy:     { bg:'rgba(99,102,241,0.08)',  text:'#a5b4fc' },
  rule:       { bg:'rgba(6,182,212,0.08)',   text:'#67e8f9' },
  evaluation: { bg:'rgba(245,158,11,0.08)',  text:'#fbbf24' },
  user:       { bg:'rgba(16,185,129,0.08)',  text:'#34d399' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function LogsPage() {
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['logs', entityFilter],
    queryFn: () => getLogs(entityFilter || undefined),
    refetchInterval: 10000,
  })

  const filtered = actionFilter ? logs.filter(l => l.action === actionFilter) : logs

  const stats = {
    total: logs.length,
    creates: logs.filter(l=>l.action==='CREATE').length,
    updates: logs.filter(l=>l.action==='UPDATE').length,
    deletes: logs.filter(l=>l.action==='DELETE').length,
    evals: logs.filter(l=>l.action==='EVALUATE').length,
  }

  return (
    <div className="p-7 space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Every action tracked · {logs.length} entries</p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label:'Total', value: stats.total,   color:'#94a3b8', bg:'rgba(100,116,139,0.1)' },
          { label:'Creates', value: stats.creates, color:'#34d399', bg:'rgba(16,185,129,0.1)'  },
          { label:'Updates', value: stats.updates, color:'#a5b4fc', bg:'rgba(99,102,241,0.1)'  },
          { label:'Deletes', value: stats.deletes, color:'#f87171', bg:'rgba(239,68,68,0.1)'   },
          { label:'Evaluations', value: stats.evals,   color:'#fbbf24', bg:'rgba(245,158,11,0.1)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-4 text-center"
            style={{ background: bg, border:`1px solid ${color}20` }}>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select className="input w-48" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
          <option value="">All Entity Types</option>
          <option value="policy">Policies</option>
          <option value="rule">Rules</option>
          <option value="evaluation">Evaluations</option>
          <option value="user">Users</option>
        </select>
        <div className="flex gap-2">
          {['', 'CREATE','UPDATE','DELETE','EVALUATE'].map(a => (
            <button key={a} onClick={() => setActionFilter(a)}
              className={"text-xs px-3 py-1.5 rounded-xl font-semibold transition-all " +
                (actionFilter === a
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-500 border border-white/05 hover:text-slate-300 hover:bg-white/5')}>
              {a || 'All'}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-slate-600 self-center">{filtered.length} entries</div>
      </div>

      {/* Timeline log */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="card h-16 animate-shimmer" />)}</div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-4 bottom-4 w-px" style={{ background:'linear-gradient(180deg, rgba(79,110,247,0.3), transparent)' }} />

          <div className="space-y-2">
            {filtered.map((log, idx) => {
              const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG['CREATE']
              const Icon = cfg.icon
              const entCfg = ENTITY_COLORS[log.entity_type] || { bg:'rgba(100,116,139,0.08)', text:'#94a3b8' }
              return (
                <div key={log.id} className="flex items-start gap-4 group">
                  {/* Timeline dot */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                    style={{ background: cfg.bg, border:`1px solid ${cfg.border}` }}>
                    <Icon size={14} style={{ color: cfg.text }} />
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-2xl px-4 py-3 transition-all duration-150"
                    style={{ background:'rgba(10,16,35,0.8)', border:'1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='rgba(79,110,247,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.04)'}>
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Action badge */}
                      <span className="text-[11px] px-2 py-0.5 rounded-md font-bold"
                        style={{ background: cfg.bg, color: cfg.text, border:`1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                      {/* Entity type */}
                      <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold capitalize"
                        style={{ background: entCfg.bg, color: entCfg.text }}>
                        {log.entity_type}
                      </span>
                      {/* Entity name */}
                      <span className="text-xs font-semibold text-white">{log.entity_name}</span>
                      {/* Separator */}
                      <span className="text-slate-700">·</span>
                      {/* User */}
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User size={10} />{log.performed_by}
                      </span>
                      {/* Details if any */}
                      {Object.keys(log.details || {}).length > 0 && (
                        <span className="text-[10px] font-mono text-slate-700 bg-white/[0.03] px-2 py-0.5 rounded max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </span>
                      )}
                      {/* Time */}
                      <span className="ml-auto text-[11px] text-slate-600 whitespace-nowrap">
                        {timeAgo(log.timestamp)}
                        <span className="text-slate-700 ml-2">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="text-center py-20 text-slate-600">
                <ScrollText size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-semibold text-slate-500">No audit logs yet</p>
                <p className="text-sm mt-1">Actions will be tracked here automatically</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}