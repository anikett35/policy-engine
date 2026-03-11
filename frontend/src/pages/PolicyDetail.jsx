import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPolicy, getRules, createRule, deleteRule, getMLSuggestions } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, ChevronLeft, Layers, ArrowRight, X,
  Settings2, Sparkles, Brain, AlertCircle,
  CheckCircle, ChevronDown, ChevronUp, Zap, RefreshCw,
  Info, Database
} from 'lucide-react'

const OPERATORS   = ['equals','not_equals','greater_than','less_than','contains','not_contains','in','not_in','is_null','is_not_null']
const ACTION_TYPES = ['allow','deny','flag','notify','transform']
const emptyCondition = () => ({ field:'', operator:'equals', value:'', data_type:'string' })
const emptyAction    = () => ({ type:'allow', message:'', parameters:{} })

const ACTION_META = {
  allow:  { bg:'rgba(16,185,129,0.1)',  text:'#34d399', border:'rgba(16,185,129,0.25)', glow:'rgba(16,185,129,0.2)'  },
  deny:   { bg:'rgba(239,68,68,0.1)',   text:'#f87171', border:'rgba(239,68,68,0.25)',  glow:'rgba(239,68,68,0.2)'   },
  flag:   { bg:'rgba(245,158,11,0.1)',  text:'#fbbf24', border:'rgba(245,158,11,0.25)', glow:'rgba(245,158,11,0.2)'  },
  notify: { bg:'rgba(99,102,241,0.1)',  text:'#a5b4fc', border:'rgba(99,102,241,0.25)', glow:'rgba(99,102,241,0.2)'  },
}

// ── Confidence Bar ────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#f87171'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width:`${value}%`, background:color, boxShadow:`0 0 6px ${color}` }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{value}%</span>
    </div>
  )
}

// ── Suggestion Card ───────────────────────────────────────────
function SuggestionCard({ suggestion, onApply, isApplied }) {
  const meta = ACTION_META[suggestion.suggested_action] || ACTION_META['notify']
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: isApplied
          ? 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.04))'
          : 'linear-gradient(135deg,rgba(15,25,50,0.9),rgba(8,14,30,0.95))',
        border: isApplied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background:`linear-gradient(90deg,transparent,${meta.text}40,transparent)` }} />
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg"
            style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.2)' }}>
            {suggestion.field}
          </span>
          <span className="text-xs text-slate-500">{suggestion.operator}</span>
          <span className="text-xs font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded-lg">{suggestion.value}</span>
          <ArrowRight size={11} className="text-slate-600" />
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={{ background:meta.bg, color:meta.text, border:`1px solid ${meta.border}` }}>
            {suggestion.suggested_action.toUpperCase()}
          </span>
          {isApplied && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <CheckCircle size={11} /> Applied
            </span>
          )}
        </div>
        {/* Confidence */}
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-slate-600 uppercase tracking-wide font-semibold">ML Confidence</span>
            <span className="text-[10px] text-slate-600">{suggestion.samples_affected} evaluations</span>
          </div>
          <ConfidenceBar value={suggestion.confidence} />
        </div>
        {/* Reason + expand */}
        <div className="flex items-start justify-between gap-2 mt-2">
          <p className="text-[11px] text-slate-500 leading-relaxed flex-1">{suggestion.reason}</p>
          <button onClick={() => setExpanded(e => !e)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/05 transition-all flex-shrink-0">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        {/* Expanded */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-1.5">
            {[['Feature Importance', `${suggestion.importance}%`, '#a5b4fc'],
              ['Data Type', suggestion.data_type, '#94a3b8'],
              ['Operator', suggestion.operator, '#94a3b8'],
              ['Threshold', suggestion.value, '#fff']
            ].map(([label, val, color]) => (
              <div key={label} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold font-mono" style={{ color }}>{val}</span>
              </div>
            ))}
          </div>
        )}
        {/* Apply button */}
        {!isApplied && (
          <button onClick={() => onApply(suggestion)}
            className="mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2"
            style={{ background:meta.bg, color:meta.text, border:`1px solid ${meta.border}` }}
            onMouseEnter={e => e.currentTarget.style.boxShadow=`0 0 16px ${meta.glow}`}
            onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
            <Zap size={12} /> Apply as Rule Condition
          </button>
        )}
      </div>
    </div>
  )
}

// ── ML Panel ──────────────────────────────────────────────────
function MLSuggestionPanel({ policyId, onApply, appliedFields }) {
  const [open, setOpen] = useState(false)
  const { data: mlData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['ml-suggestions', policyId],
    queryFn:  () => getMLSuggestions(policyId),
    enabled:  open,
    staleTime: 60_000,
  })
  const suggestions  = mlData?.suggestions || []
  const modelInfo    = mlData?.model_info  || {}
  const status       = mlData?.status
  const numericCount = mlData?.numeric_suggestions?.length || 0
  const stringCount  = mlData?.string_suggestions?.length  || 0

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border:'1px solid rgba(139,92,246,0.25)', background:'linear-gradient(135deg,rgba(139,92,246,0.05),rgba(79,110,247,0.03))' }}>

      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all"
        style={{ borderBottom: open ? '1px solid rgba(139,92,246,0.15)' : 'none' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(79,110,247,0.15))' }}>
          <Brain size={18} className="text-violet-400" />
          <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">ML Smart Rule Suggestions</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background:'rgba(139,92,246,0.15)', color:'#c4b5fd', border:'1px solid rgba(139,92,246,0.25)' }}>
              Random Forest
            </span>
            {suggestions.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {suggestions.length} suggestions ready
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Past evaluations analyze करून AI automatically rule conditions suggest करतो
          </p>
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <button onClick={e => { e.stopPropagation(); refetch() }} disabled={isFetching}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
          )}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="p-5 space-y-4">

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-400">Random Forest training on past evaluations...</span>
              </div>
              {[1,2,3].map(i => (
                <div key={i} className="h-24 rounded-2xl animate-shimmer"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">ML Service Error</p>
                <p className="text-xs text-slate-500 mt-0.5">Backend ML service connect होत नाही. Backend running आहे का?</p>
              </div>
            </div>
          )}

          {/* No data */}
          {!isLoading && !isError && status === 'insufficient_data' && (
            <div className="text-center py-8">
              <Database size={40} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">Insufficient Training Data</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">{mlData?.message}</p>
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 px-3 py-2 rounded-xl border border-violet-500/20">
                <Info size={12} /> Bulk Evaluate page वरून CSV upload करा
              </div>
            </div>
          )}

          {/* Success */}
          {!isLoading && !isError && status === 'success' && (
            <>
              {/* Model info */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl flex-wrap"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-slate-500">
                    <span className="text-white font-semibold">{modelInfo.n_evaluations || 0}</span> evaluations trained
                  </span>
                </div>
                <div className="w-px h-3 bg-slate-700" />
                <span className="text-[11px] text-slate-500">
                  <span className="text-violet-300 font-semibold">{modelInfo.n_trees || 10}</span> decision trees
                </span>
                <div className="w-px h-3 bg-slate-700" />
                <span className="text-[11px] text-slate-500">
                  <span className="text-indigo-300 font-semibold">{numericCount}</span> numeric +{' '}
                  <span className="text-cyan-300 font-semibold">{stringCount}</span> string fields
                </span>
                {modelInfo.top_features?.[0] && (
                  <>
                    <div className="w-px h-3 bg-slate-700" />
                    <span className="text-[11px] text-slate-500">
                      Top field: <span className="text-amber-300 font-mono font-semibold">{modelInfo.top_features[0].field}</span>
                      <span className="text-slate-600 ml-1">({modelInfo.top_features[0].importance}%)</span>
                    </span>
                  </>
                )}
              </div>

              {/* Decision distribution */}
              {modelInfo.decision_distribution && (
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(modelInfo.decision_distribution).map(([dec, count]) => {
                    const meta  = ACTION_META[dec] || ACTION_META['notify']
                    const total = Object.values(modelInfo.decision_distribution).reduce((a,b)=>a+b,0)
                    const pct   = total ? Math.round((count/total)*100) : 0
                    return (
                      <div key={dec} className="rounded-xl px-3 py-2 text-center"
                        style={{ background:meta.bg, border:`1px solid ${meta.border}` }}>
                        <div className="text-lg font-bold" style={{ color:meta.text }}>{count}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color:meta.text }}>{dec}</div>
                        <div className="text-[10px] text-slate-600">{pct}%</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Cards */}
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-violet-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">AI Generated Suggestions</span>
                <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.05)' }} />
                <span className="text-[10px] text-slate-600">
                  {suggestions.filter(s => appliedFields.has(s.field+s.operator+s.value)).length}/{suggestions.length} applied
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {suggestions.map((s,i) => (
                  <SuggestionCard key={i} suggestion={s} onApply={onApply}
                    isApplied={appliedFields.has(s.field+s.operator+s.value)} />
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.12)' }}>
                <Info size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  हे suggestions past evaluation patterns वरून आहेत. <span className="text-slate-300">Random Forest</span> algorithm 10 decision trees चालवतो आणि feature importance नुसार best conditions suggest करतो. Apply केल्यावर form pre-fill होतो — तुम्ही edit करू शकता.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function PolicyDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { data: policy }   = useQuery({ queryKey: ['policy', id], queryFn: () => getPolicy(id) })
  const { data: rules = [] } = useQuery({ queryKey: ['rules', id],  queryFn: () => getRules(id) })

  const [showForm, setShowForm]         = useState(false)
  const [appliedFields, setAppliedFields] = useState(new Set())
  const [form, setForm] = useState({
    name:'', description:'', priority:1, logic:'AND',
    conditions:[emptyCondition()], actions:[emptyAction()], is_active:true
  })

  const createMut = useMutation({
    mutationFn: data => createRule({ ...data, policy_id: id }),
    onSuccess: () => { qc.invalidateQueries(['rules',id]); setShowForm(false); toast.success('Rule created!') }
  })
  const deleteMut = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => { qc.invalidateQueries(['rules',id]); toast.success('Rule deleted') }
  })

  const addCondition    = () => setForm(f => ({ ...f, conditions: [...f.conditions, emptyCondition()] }))
  const removeCondition = i  => setForm(f => ({ ...f, conditions: f.conditions.filter((_,idx) => idx!==i) }))
  const updateCondition = (i,key,val) => setForm(f => ({
    ...f, conditions: f.conditions.map((c,idx) => idx===i ? {...c,[key]:val} : c)
  }))
  const handleSubmit = e => { e.preventDefault(); createMut.mutate(form) }

  // ── Apply ML suggestion → pre-fill form ────────────────
  const handleApplySuggestion = (suggestion) => {
    const key = suggestion.field + suggestion.operator + suggestion.value
    setAppliedFields(prev => new Set([...prev, key]))
    setShowForm(true)
    setForm(f => ({
      ...f,
      name: f.name || `${suggestion.field} ${suggestion.operator} ${suggestion.value}`,
      conditions: [
        ...f.conditions.filter(c => c.field !== ''),
        { field: suggestion.field, operator: suggestion.operator, value: suggestion.value, data_type: suggestion.data_type }
      ],
      actions: [{ type: suggestion.suggested_action, message:'', parameters:{} }]
    }))
    toast.success(`🤖 "${suggestion.field} ${suggestion.operator} ${suggestion.value}" → ${suggestion.suggested_action.toUpperCase()} form मध्ये apply झाले!`, { duration: 3000 })
    setTimeout(() => document.getElementById('rule-form')?.scrollIntoView({ behavior:'smooth', block:'start' }), 100)
  }

  if (!policy) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-7 space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/policies" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/05 transition-all flex-shrink-0 mt-0.5"
          style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
          <ChevronLeft size={17} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">{policy.name}</h1>
            <span className={"badge badge-" + policy.status}>{policy.status}</span>
            <span className="text-xs text-slate-600 font-mono">v{policy.version}</span>
          </div>
          <p className="text-slate-500 text-sm">{policy.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{ background:'rgba(99,102,241,0.1)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.2)' }}>
              {policy.category}
            </span>
            {policy.tags?.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background:'rgba(255,255,255,0.04)', color:'#64748b', border:'1px solid rgba(255,255,255,0.06)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <button className="btn-primary flex-shrink-0" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add Rule
        </button>
      </div>

      {/* ══ ML PANEL ══ */}
      <MLSuggestionPanel policyId={id} onApply={handleApplySuggestion} appliedFields={appliedFields} />

      {/* Add Rule Form */}
      {showForm && (
        <div id="rule-form" className="relative rounded-2xl p-6 animate-fade-up"
          style={{ background:'linear-gradient(135deg,rgba(79,110,247,0.06),rgba(108,61,232,0.04))', border:'1px solid rgba(79,110,247,0.2)' }}>
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background:'linear-gradient(90deg,transparent,rgba(79,110,247,0.5),transparent)' }} />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-indigo-400" />
              <h3 className="font-bold text-white">Create New Rule</h3>
              {form.conditions.some(c => c.field !== '') && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background:'rgba(139,92,246,0.12)', color:'#c4b5fd', border:'1px solid rgba(139,92,246,0.2)' }}>
                  🤖 ML Pre-filled
                </span>
              )}
            </div>
            <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Rule Name</label>
                <input className="input" placeholder="e.g. Age Check" value={form.name}
                  onChange={e => setForm(f => ({...f,name:e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Priority</label>
                <input className="input" type="number" min="1" value={form.priority}
                  onChange={e => setForm(f => ({...f,priority:parseInt(e.target.value)}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Logic Mode</label>
                <div className="flex gap-2">
                  {['AND','OR'].map(l => (
                    <button key={l} type="button" onClick={() => setForm(f => ({...f,logic:l}))}
                      className={"flex-1 py-2.5 rounded-xl text-sm font-bold transition-all " + (form.logic===l ? 'text-white' : 'text-slate-500 hover:text-slate-300')}
                      style={form.logic===l
                        ? { background:'linear-gradient(135deg,#4f6ef7,#6c3de8)', boxShadow:'0 0 16px rgba(79,110,247,0.3)' }
                        : { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(f => ({...f,is_active:!f.is_active}))}
                    className="w-10 h-5 rounded-full transition-all cursor-pointer relative"
                    style={form.is_active ? { background:'linear-gradient(135deg,#4f6ef7,#6c3de8)' } : { background:'#334155' }}>
                    <div className={"absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all " + (form.is_active ? 'left-5' : 'left-0.5')} />
                  </div>
                  <span className="text-sm text-slate-300 font-medium">Active</span>
                </label>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Conditions {form.conditions.some(c=>c.field!=='') && <span className="text-violet-400 normal-case ml-1">(ML suggested ✓)</span>}
                </label>
                <button type="button" onClick={addCondition} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <Plus size={11} /> Add Condition
                </button>
              </div>
              <div className="space-y-2">
                {form.conditions.map((c,i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input className="input col-span-3" placeholder="field name" value={c.field} onChange={e => updateCondition(i,'field',e.target.value)} required />
                    <select className="input col-span-3" value={c.operator} onChange={e => updateCondition(i,'operator',e.target.value)}>
                      {OPERATORS.map(op => <option key={op}>{op}</option>)}
                    </select>
                    <input className="input col-span-3" placeholder="value" value={c.value} onChange={e => updateCondition(i,'value',e.target.value)} />
                    <select className="input col-span-2" value={c.data_type} onChange={e => updateCondition(i,'data_type',e.target.value)}>
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                    <button type="button" onClick={() => removeCondition(i)} disabled={form.conditions.length===1}
                      className="col-span-1 w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 mx-auto">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Action When Triggered</label>
              <div className="flex gap-2 flex-wrap">
                {ACTION_TYPES.map(a => {
                  const meta = ACTION_META[a] || ACTION_META['notify']
                  const selected = form.actions[0]?.type === a
                  return (
                    <button key={a} type="button" onClick={() => setForm(f => ({...f,actions:[{...f.actions[0],type:a}]}))}
                      className={"px-4 py-2 rounded-xl text-sm font-bold transition-all " + (selected ? '' : 'opacity-40 hover:opacity-70')}
                      style={selected
                        ? { background:meta.bg, color:meta.text, border:`1px solid ${meta.border}`, boxShadow:`0 0 12px ${meta.bg}` }
                        : { background:'rgba(255,255,255,0.03)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.06)' }}>
                      {a}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={createMut.isPending} className="btn-primary">
                {createMut.isPending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                  : <><Plus size={14} /> Create Rule</>}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layers size={15} className="text-slate-600" />
          <span className="text-sm font-semibold text-slate-400">{rules.length} Rules</span>
          {rules.length > 0 && <span className="text-[10px] text-slate-700">· sorted by priority</span>}
        </div>
        <div className="space-y-3 stagger">
          {[...rules].sort((a,b) => a.priority-b.priority).map(r => {
            const meta = ACTION_META[r.actions?.[0]?.type] || ACTION_META['notify']
            return (
              <div key={r.id} className="group relative rounded-2xl p-5 transition-all duration-200"
                style={{ background:'linear-gradient(135deg,rgba(12,20,40,0.9),rgba(8,14,28,0.95))', border:'1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor=meta.border}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}>
                <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full" style={{ background:meta.text, opacity:0.5 }} />
                <div className="flex items-start gap-4 pl-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background:meta.bg, color:meta.text, border:`1px solid ${meta.border}` }}>
                    #{r.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="font-bold text-white text-sm">{r.name}</span>
                      <span className={"text-[10px] px-2 py-0.5 rounded-full font-semibold " + (r.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20')}>
                        {r.is_active ? '● Active' : '○ Inactive'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold" style={{ background:'rgba(255,255,255,0.05)', color:'#64748b' }}>
                        {r.logic}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.conditions?.map((c,i) => (
                        <span key={i} className="text-[11px] px-3 py-1.5 rounded-lg font-mono"
                          style={{ background:'rgba(255,255,255,0.04)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-slate-300">{c.field}</span>
                          <span className="text-slate-600 mx-1">{c.operator}</span>
                          <span className="text-indigo-300">{c.value}</span>
                        </span>
                      ))}
                      {r.conditions?.length > 0 && <ArrowRight size={11} className="text-slate-700" />}
                      {r.actions?.map((a,i) => {
                        const am = ACTION_META[a.type] || ACTION_META['notify']
                        return (
                          <span key={i} className="text-[11px] px-3 py-1.5 rounded-lg font-bold"
                            style={{ background:am.bg, color:am.text, border:`1px solid ${am.border}` }}>
                            {a.type}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <button onClick={() => deleteMut.mutate(r.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
          {rules.length === 0 && (
            <div className="text-center py-20 text-slate-600">
              <Layers size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-slate-500">No rules yet</p>
              <p className="text-sm mt-1">👆 ML Suggestions panel उघडा किंवा "Add Rule" click करा</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}