import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPolicy, getRules, createRule, deleteRule, getMLSuggestions } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, ChevronLeft, Layers, ArrowRight, X,
  Settings2, Brain, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Zap, RefreshCw, Info, Database
} from 'lucide-react'

const OPERATORS    = ['equals','not_equals','greater_than','less_than','contains','not_contains','in','not_in','is_null','is_not_null']
const ACTION_TYPES = ['allow','deny','flag','notify','transform']
const emptyCondition = () => ({ field: '', operator: 'equals', value: '', data_type: 'string' })
const emptyAction    = () => ({ type: 'allow', message: '', parameters: {} })

const ACTION_META = {
  allow:  { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  deny:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  flag:   { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  notify: { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
}

const INPUT_STYLE = {
  width: '100%', padding: '8px 11px', background: '#f9fafb',
  border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13,
  color: '#111827', outline: 'none', boxSizing: 'border-box',
}

// ── Confidence Bar ────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const color = value >= 80 ? '#16a34a' : value >= 60 ? '#d97706' : '#dc2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, tabularNums: true, minWidth: 34 }}>{value}%</span>
    </div>
  )
}

// ── Suggestion Card ───────────────────────────────────────────
function SuggestionCard({ suggestion, onApply, isApplied }) {
  const [expanded, setExpanded] = useState(false)
  const meta = ACTION_META[suggestion.suggested_action] || ACTION_META.notify

  return (
    <div style={{
      border: `1px solid ${isApplied ? '#bbf7d0' : '#e4e7ed'}`,
      borderRadius: 12, background: isApplied ? '#f0fdf4' : '#fff',
      overflow: 'hidden', transition: 'all 0.15s',
    }}>
      <div style={{ padding: '12px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontFamily: 'monospace', background: '#eef2ff', color: '#3730a3', padding: '3px 8px', borderRadius: 6, border: '1px solid #e0e7ff' }}>
            {suggestion.field}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{suggestion.operator}</span>
          <span style={{ fontSize: 11, fontWeight: 700, background: '#f9fafb', color: '#111827', padding: '3px 8px', borderRadius: 6, border: '1px solid #e4e7ed' }}>
            {suggestion.value}
          </span>
          <ArrowRight size={11} color="#9ca3af" />
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}>
            {suggestion.suggested_action.toUpperCase()}
          </span>
          {isApplied && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#16a34a' }}>
              <CheckCircle size={11} /> Applied
            </span>
          )}
        </div>

        {/* Confidence */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ML Confidence</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{suggestion.samples_affected} samples</span>
          </div>
          <ConfidenceBar value={suggestion.confidence} />
        </div>

        {/* Reason */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, margin: 0, flex: 1 }}>{suggestion.reason}</p>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ width: 24, height: 24, borderRadius: 7, background: 'none', border: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexShrink: 0 }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[['Feature Importance', `${suggestion.importance}%`], ['Data Type', suggestion.data_type], ['Threshold', suggestion.value]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: '#9ca3af' }}>{l}</span>
                <span style={{ fontWeight: 600, color: '#374151', fontFamily: 'monospace' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Apply button */}
        {!isApplied && (
          <button
            onClick={() => onApply(suggestion)}
            style={{ width: '100%', marginTop: 10, background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`, borderRadius: 9, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'opacity 0.15s' }}
          >
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

  const suggestions = mlData?.suggestions || []
  const modelInfo   = mlData?.model_info  || {}
  const status      = mlData?.status

  return (
    <div style={{ border: '1px solid #c7d2fe', borderRadius: 14, overflow: 'hidden', background: '#fafbff' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: open ? '1px solid #e0e7ff' : 'none' }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
          <Brain size={18} color="#4f6ef7" />
          <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#4f6ef7', border: '2px solid #fafbff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>ML Smart Rule Suggestions</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: '#eef2ff', color: '#4f6ef7', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: 20 }}>Random Forest</span>
            {suggestions.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 20 }}>
                {suggestions.length} suggestions ready
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>AI analyzes past evaluations to suggest rule conditions automatically</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {open && (
            <button
              onClick={e => { e.stopPropagation(); refetch() }}
              disabled={isFetching}
              style={{ width: 28, height: 28, borderRadius: 8, background: '#fff', border: '1px solid #e4e7ed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            >
              <RefreshCw size={12} style={{ animation: isFetching ? 'spin 0.7s linear infinite' : 'none' }} />
            </button>
          )}
          <div style={{ color: '#9ca3af' }}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div>
        </div>
      </button>

      {open && (
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, border: '2px solid #4f6ef7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Training Random Forest on past evaluations…</span>
              </div>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 80, background: '#f3f4f6', borderRadius: 10 }} />)}
            </div>
          )}

          {isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px' }}>
              <AlertCircle size={16} color="#dc2626" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', margin: '0 0 2px' }}>ML Service Error</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Unable to connect to backend ML service.</p>
              </div>
            </div>
          )}

          {!isLoading && !isError && status === 'insufficient_data' && (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <Database size={36} color="#d1d5db" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Insufficient Training Data</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 12px' }}>{mlData?.message}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4f6ef7', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '6px 14px', borderRadius: 8 }}>
                <Info size={12} /> Upload a CSV via Bulk Evaluate to generate data
              </span>
            </div>
          )}

          {!isLoading && !isError && status === 'success' && (
            <>
              {/* Model info bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, padding: '9px 14px', fontSize: 12 }}>
                <span style={{ color: '#6b7280' }}>
                  <strong style={{ color: '#111827' }}>{modelInfo.n_evaluations || 0}</strong> evaluations trained
                </span>
                <span style={{ color: '#d1d5db' }}>·</span>
                <span style={{ color: '#6b7280' }}>
                  <strong style={{ color: '#4f6ef7' }}>{modelInfo.n_trees || 10}</strong> decision trees
                </span>
                {modelInfo.top_features?.[0] && (
                  <>
                    <span style={{ color: '#d1d5db' }}>·</span>
                    <span style={{ color: '#6b7280' }}>
                      Top field: <strong style={{ color: '#d97706', fontFamily: 'monospace' }}>{modelInfo.top_features[0].field}</strong>
                    </span>
                  </>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
                  {suggestions.filter(s => appliedFields.has(s.field + s.operator + s.value)).length}/{suggestions.length} applied
                </span>
              </div>

              {/* Suggestion cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {suggestions.map((s, i) => (
                  <SuggestionCard
                    key={i}
                    suggestion={s}
                    onApply={onApply}
                    isApplied={appliedFields.has(s.field + s.operator + s.value)}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '10px 14px' }}>
                <Info size={13} color="#4f6ef7" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: '#4338ca', margin: 0, lineHeight: 1.5 }}>
                  Suggestions are derived from past evaluation patterns using a Random Forest model. Clicking Apply pre-fills the rule form — you can edit before saving.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function PolicyDetail() {
  const { id } = useParams()
  const qc = useQueryClient()

  const { data: policy }     = useQuery({ queryKey: ['policy', id], queryFn: () => getPolicy(id)  })
  const { data: rules = [] } = useQuery({ queryKey: ['rules',  id], queryFn: () => getRules(id)   })

  const [showForm,     setShowForm]     = useState(false)
  const [appliedFields, setAppliedFields] = useState(new Set())
  const [form, setForm] = useState({
    name: '', description: '', priority: 1, logic: 'AND',
    conditions: [emptyCondition()], actions: [emptyAction()], is_active: true,
  })

  const createMut = useMutation({
    mutationFn: data => createRule({ ...data, policy_id: id }),
    onSuccess: () => { qc.invalidateQueries(['rules', id]); setShowForm(false); toast.success('Rule created!') },
    onError:   () => toast.error('Failed to create rule.'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => { qc.invalidateQueries(['rules', id]); toast.success('Rule deleted') },
  })

  const addCondition    = () => setForm(f => ({ ...f, conditions: [...f.conditions, emptyCondition()] }))
  const removeCondition = i  => setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }))
  const updateCondition = (i, key, val) => setForm(f => ({
    ...f, conditions: f.conditions.map((c, idx) => idx === i ? { ...c, [key]: val } : c),
  }))

  const handleSubmit = e => { e.preventDefault(); createMut.mutate(form) }

  const handleApplySuggestion = suggestion => {
    const key = suggestion.field + suggestion.operator + suggestion.value
    setAppliedFields(prev => new Set([...prev, key]))
    setShowForm(true)
    setForm(f => ({
      ...f,
      name:       f.name || `${suggestion.field} ${suggestion.operator} ${suggestion.value}`,
      conditions: [...f.conditions.filter(c => c.field !== ''), { field: suggestion.field, operator: suggestion.operator, value: suggestion.value, data_type: suggestion.data_type }],
      actions:    [{ type: suggestion.suggested_action, message: '', parameters: {} }],
    }))
    toast.success(`Applied: ${suggestion.field} ${suggestion.operator} ${suggestion.value}`)
    setTimeout(() => document.getElementById('rule-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  if (!policy) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
      <div style={{ width: 24, height: 24, border: '2px solid #4f6ef7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
        <Link
          to="/policies"
          style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: '1px solid #e4e7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textDecoration: 'none', flexShrink: 0, marginTop: 2, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff';    e.currentTarget.style.color = '#6b7280' }}
        >
          <ChevronLeft size={16} />
        </Link>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{policy.name}</h1>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: policy.status === 'active' ? '#dcfce7' : '#f3f4f6', color: policy.status === 'active' ? '#166534' : '#6b7280' }}>
              {policy.status}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>v{policy.version}</span>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px' }}>{policy.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, background: '#eef2ff', color: '#3730a3', padding: '3px 10px', borderRadius: 20, border: '1px solid #c7d2fe' }}>{policy.category}</span>
            {policy.tags?.map(t => (
              <span key={t} style={{ fontSize: 10, background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: 20 }}>{t}</span>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          <Plus size={14} /> Add Rule
        </button>
      </div>

      {/* ML Panel */}
      <div style={{ marginBottom: 20 }}>
        <MLSuggestionPanel policyId={id} onApply={handleApplySuggestion} appliedFields={appliedFields} />
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <div
          id="rule-form"
          style={{ background: '#fff', border: '1px solid #c7d2fe', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings2 size={16} color="#4f6ef7" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Create New Rule</h3>
              {form.conditions.some(c => c.field !== '') && (
                <span style={{ fontSize: 10, fontWeight: 700, background: '#eef2ff', color: '#4f6ef7', border: '1px solid #c7d2fe', padding: '2px 8px', borderRadius: 20 }}>ML Pre-filled</span>
              )}
            </div>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name + priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Rule Name</label>
                <input required style={INPUT_STYLE} placeholder="e.g. Age Check" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Priority</label>
                <input style={INPUT_STYLE} type="number" min="1" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))} />
              </div>
            </div>

            {/* Logic + Active */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Logic Mode</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['AND', 'OR'].map(l => (
                    <button
                      key={l} type="button"
                      onClick={() => setForm(f => ({ ...f, logic: l }))}
                      style={{ flex: 1, padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: form.logic === l ? '#4f6ef7' : '#f9fafb', color: form.logic === l ? '#fff' : '#6b7280', borderColor: form.logic === l ? '#4f6ef7' : '#e4e7ed' }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    style={{ width: 38, height: 20, borderRadius: 99, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', background: form.is_active ? '#4f6ef7' : '#d1d5db' }}
                  >
                    <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: form.is_active ? 20 : 2 }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Active</span>
                </label>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Conditions {form.conditions.some(c => c.field !== '') && <span style={{ color: '#4f6ef7', textTransform: 'none', fontWeight: 500 }}>(ML suggested)</span>}
                </label>
                <button type="button" onClick={addCondition} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#4f6ef7', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 7 }}>
                  <Plus size={11} /> Add Condition
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {form.conditions.map((c, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 3fr 3fr 2fr 28px', gap: 7, alignItems: 'center' }}>
                    <input style={INPUT_STYLE} placeholder="field name" value={c.field}      required onChange={e => updateCondition(i, 'field', e.target.value)} />
                    <select style={INPUT_STYLE}                           value={c.operator}          onChange={e => updateCondition(i, 'operator', e.target.value)}>
                      {OPERATORS.map(op => <option key={op}>{op}</option>)}
                    </select>
                    <input style={INPUT_STYLE} placeholder="value"       value={c.value}             onChange={e => updateCondition(i, 'value', e.target.value)} />
                    <select style={INPUT_STYLE}                           value={c.data_type}          onChange={e => updateCondition(i, 'data_type', e.target.value)}>
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                    <button
                      type="button" onClick={() => removeCondition(i)}
                      disabled={form.conditions.length === 1}
                      style={{ width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', cursor: form.conditions.length === 1 ? 'not-allowed' : 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: form.conditions.length === 1 ? 0.3 : 1 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action type */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Action When Triggered</label>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {ACTION_TYPES.map(a => {
                  const meta     = ACTION_META[a] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed' }
                  const selected = form.actions[0]?.type === a
                  return (
                    <button
                      key={a} type="button"
                      onClick={() => setForm(f => ({ ...f, actions: [{ ...f.actions[0], type: a }] }))}
                      style={{ padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: selected ? meta.bg : '#f9fafb', color: selected ? meta.text : '#9ca3af', borderColor: selected ? meta.border : '#e4e7ed', opacity: selected ? 1 : 0.7 }}
                    >
                      {a}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button
                type="submit"
                disabled={createMut.isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: createMut.isPending ? 0.6 : 1 }}
              >
                {createMut.isPending
                  ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating…</>
                  : <><Plus size={13} /> Create Rule</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#6b7280', border: '1px solid #e4e7ed', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules list */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Layers size={15} color="#9ca3af" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{rules.length} Rules</span>
          {rules.length > 0 && <span style={{ fontSize: 11, color: '#9ca3af' }}>· sorted by priority</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...rules].sort((a, b) => a.priority - b.priority).map(r => {
            const meta     = ACTION_META[r.actions?.[0]?.type] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed' }
            return (
              <div
                key={r.id}
                style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 13, padding: '15px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'box-shadow 0.15s', position: 'relative' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
              >
                {/* Left accent */}
                <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: '0 3px 3px 0', background: meta.border }} />

                <div style={{ width: 34, height: 34, borderRadius: 9, background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: meta.text, flexShrink: 0, marginLeft: 8 }}>
                  {r.priority}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: r.is_active ? '#dcfce7' : '#f3f4f6', color: r.is_active ? '#166534' : '#6b7280' }}>
                      {r.is_active ? 'active' : 'inactive'}
                    </span>
                    <span style={{ fontSize: 10, background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: 20 }}>{r.logic}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {r.conditions?.map((c, i) => (
                      <span key={i} style={{ fontSize: 11, fontFamily: 'monospace', padding: '4px 10px', borderRadius: 8, background: '#f9fafb', color: '#374151', border: '1px solid #f3f4f6' }}>
                        <span style={{ color: '#4f6ef7' }}>{c.field}</span>
                        <span style={{ color: '#9ca3af', margin: '0 4px' }}>{c.operator}</span>
                        <span style={{ fontWeight: 700 }}>{c.value}</span>
                      </span>
                    ))}
                    {r.conditions?.length > 0 && <ArrowRight size={11} color="#d1d5db" />}
                    {r.actions?.map((a, i) => {
                      const am = ACTION_META[a.type] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed' }
                      return (
                        <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: am.bg, color: am.text, border: `1px solid ${am.border}` }}>
                          {a.type}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={() => { if (window.confirm('Delete this rule?')) deleteMut.mutate(r.id) }}
                  style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = '#f3f4f6' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}

          {rules.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <Layers size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontWeight: 600, color: '#6b7280', fontSize: 14, margin: '0 0 4px' }}>No rules yet</p>
              <p style={{ fontSize: 13, margin: 0 }}>Open the ML Suggestions panel or click "Add Rule" to create one</p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}