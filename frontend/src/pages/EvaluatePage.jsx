import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPolicies, runEvaluation } from '../api/endpoints'
import toast from 'react-hot-toast'
import { Play, Plus, Trash2, CheckCircle, XCircle, Flag, Clock, Zap } from 'lucide-react'

const DECISION_STYLES = {
  allow: { bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle, color: '#16a34a', label: 'Approved' },
  deny:  { bg: '#fff5f5', border: '#fca5a5', icon: XCircle,     color: '#dc2626', label: 'Denied'   },
  flag:  { bg: '#fffbeb', border: '#fde047', icon: Flag,        color: '#d97706', label: 'Flagged'  },
}

const INPUT_STYLE = {
  width: '100%', padding: '8px 11px', background: '#f9fafb',
  border: '1px solid #e4e7ed', borderRadius: 9, fontSize: 13,
  color: '#111827', outline: 'none', boxSizing: 'border-box',
}

export default function EvaluatePage() {
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })

  const [selectedPolicy, setSelectedPolicy] = useState('')
  const [fields, setFields] = useState([{ key: '', value: '' }])
  const [result, setResult] = useState(null)

  const evalMut = useMutation({
    mutationFn: runEvaluation,
    onSuccess: data => { setResult(data); toast.success('Evaluation complete!') },
    onError:   err  => toast.error(err.response?.data?.detail || 'Evaluation failed'),
  })

  const addField    = () => setFields(f => [...f, { key: '', value: '' }])
  const removeField = i  => setFields(f => f.filter((_, idx) => idx !== i))
  const updateField = (i, k, v) => setFields(f => f.map((fd, idx) => idx === i ? { ...fd, [k]: v } : fd))

  const handleRun = () => {
    if (!selectedPolicy) return toast.error('Select a policy')
    const inputData = Object.fromEntries(fields.filter(f => f.key).map(f => [f.key, f.value]))
    evalMut.mutate({ policy_id: selectedPolicy, input_data: inputData })
  }

  const jsonPreview = JSON.stringify(
    Object.fromEntries(fields.filter(f => f.key).map(f => [f.key, f.value])),
    null, 2
  )

  return (
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Evaluate Policy</h1>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Run input data against a policy's rules</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Input ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Policy selector */}
          <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Select Policy
            </label>
            <select
              value={selectedPolicy}
              onChange={e => setSelectedPolicy(e.target.value)}
              style={{ ...INPUT_STYLE }}
            >
              <option value="">Choose a policy…</option>
              {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Input fields */}
          <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Input Data</h3>
              <button
                onClick={addField}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#4f6ef7', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 7, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Plus size={12} /> Add Field
              </button>
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 4 }}>Field Name</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 4 }}>Value</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {fields.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 8, alignItems: 'center' }}>
                  <input
                    style={INPUT_STYLE}
                    placeholder="field_name"
                    value={f.key}
                    onChange={e => updateField(i, 'key', e.target.value)}
                  />
                  <input
                    style={INPUT_STYLE}
                    placeholder="value"
                    value={f.value}
                    onChange={e => updateField(i, 'value', e.target.value)}
                  />
                  <button
                    onClick={() => removeField(i)}
                    disabled={fields.length === 1}
                    style={{ width: 28, height: 28, borderRadius: 7, background: 'none', border: 'none', cursor: fields.length === 1 ? 'not-allowed' : 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fields.length === 1 ? 0.3 : 1, transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (fields.length > 1) { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626' } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* JSON preview */}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Preview</p>
              <pre style={{ background: '#f9fafb', border: '1px solid #e4e7ed', borderRadius: 9, padding: '10px 12px', fontSize: 11, color: '#16a34a', fontFamily: 'monospace', overflow: 'auto', maxHeight: 110, margin: 0 }}>
                {jsonPreview}
              </pre>
            </div>

            <button
              onClick={handleRun}
              disabled={evalMut.isPending || !selectedPolicy}
              style={{ width: '100%', marginTop: 16, background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 600, cursor: evalMut.isPending || !selectedPolicy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: (evalMut.isPending || !selectedPolicy) ? 0.5 : 1, transition: 'opacity 0.15s' }}
            >
              {evalMut.isPending
                ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Evaluating…</>
                : <><Play size={14} /> Run Evaluation</>}
            </button>
          </div>
        </div>

        {/* ── Right: Result ── */}
        <div>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Decision banner */}
              {(() => {
                const ds = DECISION_STYLES[result.final_decision] || DECISION_STYLES.allow
                const DecIcon = ds.icon
                return (
                  <div style={{ background: ds.bg, border: `2px solid ${ds.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <DecIcon size={32} color={ds.color} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{ds.label}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{result.policy_name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{result.rules_matched}/{result.rules_total}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>rules matched</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 12, marginLeft: 6 }}>
                        <Clock size={13} /> {result.execution_time_ms}ms
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Rule results */}
              <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Rule Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.results?.map((r, i) => (
                    <div
                      key={i}
                      style={{ borderRadius: 10, padding: '12px 14px', border: `1px solid ${r.matched ? '#bbf7d0' : '#e4e7ed'}`, background: r.matched ? '#f0fdf4' : '#fafafa' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: r.conditions_evaluated?.length ? 9 : 0 }}>
                        {r.matched
                          ? <CheckCircle size={15} color="#16a34a" />
                          : <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid #d1d5db', flexShrink: 0 }} />}
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{r.rule_name}</span>
                        {r.matched && r.actions_triggered.map(a => (
                          <span key={a} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: DECISION_STYLES[a]?.bg || '#f3f4f6', color: DECISION_STYLES[a]?.color || '#374151' }}>
                            {a.toUpperCase()}
                          </span>
                        ))}
                      </div>
                      {r.conditions_evaluated?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 23 }}>
                          {r.conditions_evaluated.map((c, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'monospace' }}>
                              <span style={{ color: c.passed ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{c.passed ? '✓' : '✗'}</span>
                              <span style={{ color: '#6b7280' }}>{c.field}</span>
                              <span style={{ color: '#9ca3af' }}>{c.operator}</span>
                              <span style={{ color: '#374151' }}>{String(c.expected)}</span>
                              <span style={{ color: '#d1d5db' }}>→</span>
                              <span style={{ fontWeight: 600, color: c.passed ? '#16a34a' : '#dc2626' }}>{String(c.actual ?? 'null')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '2px dashed #e4e7ed', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, padding: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Zap size={22} color="#d1d5db" />
              </div>
              <p style={{ fontWeight: 600, color: '#9ca3af', fontSize: 13, margin: 0, textAlign: 'center' }}>
                Configure input data and run<br />an evaluation to see results here
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}