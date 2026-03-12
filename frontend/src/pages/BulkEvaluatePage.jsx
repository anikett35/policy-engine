import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPolicies, runEvaluation } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Upload, FileSpreadsheet, Play, Download,
  CheckCircle, XCircle, Flag, Trash2,
  AlertCircle, FileText, Loader2
} from 'lucide-react'

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map((line, i) => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = values[idx] ?? '' })
    return { _rowIndex: i + 1, ...obj }
  })
}

function resultsToCSV(rows) {
  if (!rows.length) return ''
  const allKeys = Object.keys(rows[0]).filter(k => k !== '_rowIndex')
  const headers = [...allKeys, 'decision', 'rules_matched', 'rules_total', 'execution_ms']
  const lines = [headers.join(',')]
  rows.forEach(r => {
    const vals = allKeys.map(k => `"${r[k] ?? ''}"`)
    vals.push(`"${r._result?.final_decision ?? ''}"`)
    vals.push(r._result?.rules_matched ?? '')
    vals.push(r._result?.rules_total ?? '')
    vals.push(r._result?.execution_time_ms ?? '')
    lines.push(vals.join(','))
  })
  return lines.join('\n')
}

const DECISION_STYLES = {
  allow: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: CheckCircle, rowBg: '#f0fdf4' },
  deny:  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: XCircle,     rowBg: '#fff5f5' },
  flag:  { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: Flag,        rowBg: '#fffbeb' },
}

export default function BulkEvaluatePage() {
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })

  const [selectedPolicy, setSelectedPolicy] = useState('')
  const [rows,           setRows]           = useState([])
  const [headers,        setHeaders]        = useState([])
  const [isRunning,      setIsRunning]      = useState(false)
  const [progress,       setProgress]       = useState(0)
  const [fileName,       setFileName]       = useState('')
  const [dragOver,       setDragOver]       = useState(false)
  const fileRef = useRef()

  const handleFile = file => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'csv') { toast.error('Only CSV files are supported'); return }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const parsed = parseCSV(e.target.result)
        if (!parsed.length) { toast.error('CSV is empty or invalid'); return }
        const hdrs = Object.keys(parsed[0]).filter(k => k !== '_rowIndex')
        setHeaders(hdrs)
        setRows(parsed.map(r => ({ ...r, _result: null, _error: null })))
        toast.success(`${parsed.length} rows loaded`)
      } catch { toast.error('Failed to parse file') }
    }
    reader.readAsText(file)
  }

  const handleRunAll = async () => {
    if (!selectedPolicy) { toast.error('Select a policy first'); return }
    if (!rows.length)    { toast.error('Upload a file first'); return }
    setIsRunning(true)
    setProgress(0)
    const updated = [...rows]
    for (let i = 0; i < updated.length; i++) {
      const row = { ...updated[i] }
      delete row._rowIndex; delete row._result; delete row._error
      try {
        const result = await runEvaluation({ policy_id: selectedPolicy, input_data: row })
        updated[i] = { ...updated[i], _result: result, _error: null }
      } catch {
        updated[i] = { ...updated[i], _result: null, _error: 'Failed' }
      }
      setRows([...updated])
      setProgress(Math.round(((i + 1) / updated.length) * 100))
    }
    setIsRunning(false)
    toast.success('All rows evaluated!')
  }

  const handleDownload = () => {
    const csv  = resultsToCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `results_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Results downloaded!')
  }

  const clearAll = () => {
    setRows([]); setHeaders([]); setFileName(''); setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const evaluated   = rows.filter(r => r._result)
  const allowCount  = evaluated.filter(r => r._result?.final_decision === 'allow').length
  const denyCount   = evaluated.filter(r => r._result?.final_decision === 'deny').length
  const flagCount   = evaluated.filter(r => r._result?.final_decision === 'flag').length

  const INPUT_STYLE = {
    padding: '9px 12px', background: '#fff', border: '1px solid #e4e7ed',
    borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none',
  }

  return (
    <div style={{ padding: 28, background: '#f8f9fb', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Bulk Evaluation</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Upload a CSV and evaluate all rows at once</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {rows.length > 0 && evaluated.length > 0 && (
            <button onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={14} /> Download Results
            </button>
          )}
          {rows.length > 0 && (
            <button onClick={clearAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#374151', border: '1px solid #e4e7ed', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Config row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Select Policy</label>
          <select style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }} value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)}>
            <option value="">Select a policy…</option>
            {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 3 }}>Sample CSV Template</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Example file for Loan Policy testing</div>
          </div>
          <button
            onClick={() => {
              const sample = `age,credit_score,employment_status,monthly_salary\n25,750,employed,50000\n30,350,employed,40000\n28,600,unemployed,0`
              const blob = new Blob([sample], { type: 'text/csv' })
              const url = URL.createObjectURL(blob); const a = document.createElement('a')
              a.href = url; a.download = 'sample_loan_data.csv'; a.click(); URL.revokeObjectURL(url)
              toast.success('Sample CSV downloaded!')
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f9fafb', color: '#374151', border: '1px solid #e4e7ed', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Download size={13} /> Download Sample
          </button>
        </div>
      </div>

      {/* Upload area */}
      {rows.length === 0 && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#4f6ef7' : '#d1d5db'}`,
            borderRadius: 14, padding: '56px 24px', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? '#f5f7ff' : '#fff', transition: 'all 0.15s', marginBottom: 18,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ width: 60, height: 60, borderRadius: 16, background: dragOver ? '#eef2ff' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileSpreadsheet size={28} color={dragOver ? '#4f6ef7' : '#9ca3af'} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>Drop your CSV file here</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>or click to browse</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, color: '#9ca3af' }}>
            {['First row = headers', 'Other rows = data', 'Headers match rule fields'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FileText size={11} /> {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File loaded */}
      {rows.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #c7d2fe', borderRadius: 12, padding: '16px 18px', marginBottom: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileSpreadsheet size={18} color="#4f6ef7" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{fileName}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{rows.length} rows · {headers.length} columns</div>
            </div>

            {evaluated.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {[['allow', allowCount, CheckCircle], ['deny', denyCount, XCircle], ['flag', flagCount, Flag]].map(([type, count, Icon]) => {
                  const ds = DECISION_STYLES[type]
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, background: ds.bg, border: `1px solid ${ds.border}`, padding: '5px 11px', borderRadius: 8 }}>
                      <Icon size={13} color={ds.text} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: ds.text }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={handleRunAll}
              disabled={isRunning || !selectedPolicy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: (isRunning || !selectedPolicy) ? 'not-allowed' : 'pointer', opacity: (isRunning || !selectedPolicy) ? 0.6 : 1, whiteSpace: 'nowrap' }}
            >
              {isRunning
                ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Running… {progress}%</>
                : <><Play size={14} /> Run {rows.length} Rows</>}
            </button>
          </div>

          {isRunning && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                <span>Evaluating…</span>
                <span>{evaluated.length} / {rows.length}</span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#4f6ef7', borderRadius: 99, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results table */}
      {rows.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>
              Results
              {evaluated.length > 0 && <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400, marginLeft: 8 }}>{evaluated.length}/{rows.length} evaluated</span>}
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', width: 40 }}>#</th>
                  {headers.map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>{h}</th>
                  ))}
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Decision</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Rules</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const decision = row._result?.final_decision
                  const ds       = decision ? DECISION_STYLES[decision] : null
                  const DecIcon  = ds?.icon
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb', background: ds ? ds.rowBg : '#fff', transition: 'background 0.1s' }}>
                      <td style={{ padding: '10px 14px', color: '#9ca3af', fontFamily: 'monospace' }}>{row._rowIndex}</td>
                      {headers.map(h => (
                        <td key={h} style={{ padding: '10px 14px', color: '#374151', fontFamily: 'monospace' }}>{row[h] ?? '—'}</td>
                      ))}
                      <td style={{ padding: '10px 14px' }}>
                        {row._result ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: ds.bg, color: ds.text, border: `1px solid ${ds.border}` }}>
                            <DecIcon size={11} /> {decision.toUpperCase()}
                          </span>
                        ) : row._error ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '3px 9px', borderRadius: 20 }}>
                            <AlertCircle size={11} /> Error
                          </span>
                        ) : isRunning && i === evaluated.length ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#4f6ef7' }}>
                            <Loader2 size={11} style={{ animation: 'spin 0.7s linear infinite' }} /> Running
                          </span>
                        ) : (
                          <div style={{ width: 60, height: 20, background: '#f3f4f6', borderRadius: 6, animation: 'shimmer 1.5s infinite' }} />
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: '#6b7280' }}>
                        {row._result ? <span>{row._result.rules_matched}<span style={{ color: '#d1d5db' }}>/{row._result.rules_total}</span></span> : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: '#9ca3af' }}>
                        {row._result ? `${row._result.execution_time_ms}ms` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}