import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPolicies, runEvaluation } from '../api/endpoints'
import toast from 'react-hot-toast'
import { Play, Plus, Trash2, CheckCircle, XCircle, Flag, Clock, Zap } from 'lucide-react'

export default function EvaluatePage() {
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })
  const [selectedPolicy, setSelectedPolicy] = useState('')
  const [fields, setFields] = useState([{ key: '', value: '' }])
  const [result, setResult] = useState(null)

  const evalMut = useMutation({
    mutationFn: runEvaluation,
    onSuccess: data => { setResult(data); toast.success('Evaluation complete!') },
    onError: err => toast.error(err.response?.data?.detail || 'Evaluation failed')
  })

  const addField = () => setFields(f => [...f, { key: '', value: '' }])
  const removeField = i => setFields(f => f.filter((_, idx) => idx !== i))
  const updateField = (i, k, v) => setFields(f => f.map((fd, idx) => idx === i ? { ...fd, [k]: v } : fd))

  const handleRun = () => {
    if (!selectedPolicy) return toast.error('Select a policy')
    const inputData = Object.fromEntries(fields.filter(f => f.key).map(f => [f.key, f.value]))
    evalMut.mutate({ policy_id: selectedPolicy, input_data: inputData })
  }

  const decisionIcon = d => d === 'allow' ? <CheckCircle size={20} className="text-emerald-400" />
    : d === 'deny' ? <XCircle size={20} className="text-red-400" />
    : <Flag size={20} className="text-amber-400" />

  const decisionStyle = d => d === 'allow' ? 'border-emerald-500/30 bg-emerald-500/5'
    : d === 'deny' ? 'border-red-500/30 bg-red-500/5'
    : 'border-amber-500/30 bg-amber-500/5'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Evaluate Policy</h1>
        <p className="text-slate-500 text-sm">Run input data against a policy's rules</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-white text-sm mb-4">Configuration</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Select Policy</label>
              <select className="input" value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)}>
                <option value="">Choose a policy...</option>
                {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Input Data</h3>
              <button onClick={addField} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                <Plus size={12} /> Add Field
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className="input" placeholder="field_name" value={f.key}
                    onChange={e => updateField(i, 'key', e.target.value)} />
                  <input className="input" placeholder="value" value={f.value}
                    onChange={e => updateField(i, 'value', e.target.value)} />
                  {fields.length > 1 && (
                    <button onClick={() => removeField(i)} className="text-slate-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* JSON preview */}
            <div className="mt-4">
              <label className="block text-xs text-slate-500 mb-2">JSON Preview</label>
              <pre className="bg-[#080d18] rounded-xl p-3 text-xs text-emerald-400 font-mono overflow-auto max-h-32">
                {JSON.stringify(Object.fromEntries(fields.filter(f => f.key).map(f => [f.key, f.value])), null, 2)}
              </pre>
            </div>

            <button onClick={handleRun} disabled={evalMut.isPending || !selectedPolicy}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3 disabled:opacity-50">
              {evalMut.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Evaluating...</>
              ) : (
                <><Play size={16} /> Run Evaluation</>
              )}
            </button>
          </div>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Decision banner */}
              <div className={`card border-2 ${decisionStyle(result.final_decision)}`}>
                <div className="flex items-center gap-3">
                  {decisionIcon(result.final_decision)}
                  <div className="flex-1">
                    <div className="text-lg font-bold text-white capitalize">{result.final_decision}</div>
                    <div className="text-xs text-slate-500">{result.policy_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{result.rules_matched}/{result.rules_total}</div>
                    <div className="text-xs text-slate-500">rules matched</div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs ml-4">
                    <Clock size={12} />
                    {result.execution_time_ms}ms
                  </div>
                </div>
              </div>

              {/* Rule results */}
              <div className="card">
                <h3 className="font-semibold text-white text-sm mb-4">Rule Results</h3>
                <div className="space-y-3">
                  {result.results?.map((r, i) => (
                    <div key={i} className={`rounded-xl p-3 border ${r.matched ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-[#1e293b]'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {r.matched ? <CheckCircle size={14} className="text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                        <span className="text-sm font-medium text-white">{r.rule_name}</span>
                        {r.matched && r.actions_triggered.map(a => (
                          <span key={a} className={`badge badge-${a === 'deny' ? 'deny' : a === 'flag' ? 'flag' : 'allow'}`}>{a}</span>
                        ))}
                      </div>
                      <div className="space-y-1 ml-5">
                        {r.conditions_evaluated?.map((c, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs">
                            <span className={c.passed ? 'text-emerald-500' : 'text-slate-600'}>●</span>
                            <span className="font-mono text-slate-400">{c.field}</span>
                            <span className="text-slate-600">{c.operator}</span>
                            <span className="font-mono text-slate-400">{String(c.expected)}</span>
                            <span className="text-slate-600">→</span>
                            <span className={`font-mono ${c.passed ? 'text-emerald-400' : 'text-red-400'}`}>{String(c.actual ?? 'null')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center py-20 text-center">
              <Zap size={48} className="text-slate-700 mb-4" />
              <p className="text-slate-500 text-sm">Configure input data and run<br />an evaluation to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
