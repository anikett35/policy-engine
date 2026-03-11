import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPolicies, runEvaluation } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Upload, FileSpreadsheet, Play, Download, CheckCircle,
  XCircle, Flag, Trash2, AlertCircle, FileText, Loader2
} from 'lucide-react'

// Parse CSV text into array of objects
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

// Convert results to CSV for download
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

const DECISION_STYLE = {
  allow: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: CheckCircle },
  deny:  { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30',     icon: XCircle },
  flag:  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   icon: Flag },
}

export default function BulkEvaluatePage() {
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })
  const [selectedPolicy, setSelectedPolicy] = useState('')
  const [rows, setRows] = useState([])
  const [headers, setHeaders] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Only CSV or Excel files supported')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        if (ext === 'csv') {
          const parsed = parseCSV(e.target.result)
          if (!parsed.length) { toast.error('CSV is empty or invalid'); return }
          const hdrs = Object.keys(parsed[0]).filter(k => k !== '_rowIndex')
          setHeaders(hdrs)
          setRows(parsed.map(r => ({ ...r, _result: null, _error: null })))
          toast.success(`✅ ${parsed.length} rows loaded!`)
        } else {
          toast.error('Please save Excel as CSV first (File → Save As → CSV)')
        }
      } catch {
        toast.error('Failed to parse file')
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleRunAll = async () => {
    if (!selectedPolicy) { toast.error('Please select a policy'); return }
    if (!rows.length) { toast.error('Please upload a file first'); return }

    setIsRunning(true)
    setProgress(0)

    const updated = [...rows]
    for (let i = 0; i < updated.length; i++) {
      const row = { ...updated[i] }
      delete row._rowIndex
      delete row._result
      delete row._error

      try {
        const result = await runEvaluation({ policy_id: selectedPolicy, input_data: row })
        updated[i] = { ...updated[i], _result: result, _error: null }
      } catch (err) {
        updated[i] = { ...updated[i], _result: null, _error: 'Failed' }
      }

      setRows([...updated])
      setProgress(Math.round(((i + 1) / updated.length) * 100))
    }

    setIsRunning(false)
    toast.success('🎉 All rows evaluated!')
  }

  const handleDownload = () => {
    const csv = resultsToCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evaluation_results_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Results downloaded!')
  }

  const clearAll = () => {
    setRows([])
    setHeaders([])
    setFileName('')
    setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const evaluated = rows.filter(r => r._result)
  const allowCount = evaluated.filter(r => r._result?.final_decision === 'allow').length
  const denyCount  = evaluated.filter(r => r._result?.final_decision === 'deny').length
  const flagCount  = evaluated.filter(r => r._result?.final_decision === 'flag').length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Bulk Evaluation</h1>
          <p className="text-slate-500 text-sm">Upload a CSV file and evaluate all rows at once</p>
        </div>
        <div className="flex gap-2">
          {rows.length > 0 && evaluated.length > 0 && (
            <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
              <Download size={15} /> Download Results
            </button>
          )}
          {rows.length > 0 && (
            <button onClick={clearAll} className="btn-ghost flex items-center gap-2">
              <Trash2 size={15} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Config row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Policy selector */}
        <div className="card">
          <label className="block text-xs text-slate-400 mb-2 font-medium">SELECT POLICY</label>
          <select className="input" value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)}>
            <option value="">Select a policy...</option>
            {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Sample CSV download */}
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white mb-1">Sample CSV Template</div>
            <div className="text-xs text-slate-500">Example CSV for Loan Policy testing</div>
          </div>
          <button
            onClick={() => {
              const sample = `age,credit_score,employment_status,monthly_salary\n25,750,employed,50000\n30,350,employed,40000\n28,600,unemployed,0\n16,800,employed,20000\n35,500,employed,60000\n22,420,unemployed,15000`
              const blob = new Blob([sample], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'sample_loan_data.csv'; a.click()
              URL.revokeObjectURL(url)
              toast.success('Sample CSV downloaded!')
            }}
            className="btn-ghost flex items-center gap-2 text-primary-400 border border-primary-500/30">
            <Download size={14} /> Download Sample
          </button>
        </div>
      </div>

      {/* Upload area */}
      {rows.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-[#2a3a52] hover:border-primary-500/50 hover:bg-[#0f172a]'
          }`}>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              dragOver ? 'bg-primary-500/20' : 'bg-[#1e293b]'
            }`}>
              <FileSpreadsheet size={32} className={dragOver ? 'text-primary-400' : 'text-slate-500'} />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">Drop your CSV File here</div>
              <div className="text-slate-500 text-sm mt-1">or click to browse files</div>
              <div className="text-slate-600 text-xs mt-3">Supports: .csv files</div>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-600 mt-2">
              <div className="flex items-center gap-1.5"><FileText size={12} />First Row = Headers</div>
              <div className="flex items-center gap-1.5"><FileText size={12} />Other Rows = Data</div>
              <div className="flex items-center gap-1.5"><FileText size={12} />Headers = Rule Field Names</div>
            </div>
          </div>
        </div>
      )}

      {/* File loaded - show info + run button */}
      {rows.length > 0 && (
        <div className="card border border-primary-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center">
                <FileSpreadsheet size={20} className="text-primary-400" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{fileName}</div>
                <div className="text-xs text-slate-500">{rows.length} rows · {headers.length} columns</div>
              </div>
            </div>

            {/* Stats when evaluated */}
            {evaluated.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                  <CheckCircle size={13} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">{allowCount} Allow</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 rounded-lg">
                  <XCircle size={13} className="text-red-400" />
                  <span className="text-xs font-semibold text-red-400">{denyCount} Deny</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-lg">
                  <Flag size={13} className="text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">{flagCount} Flag</span>
                </div>
              </div>
            )}

            <button
              onClick={handleRunAll}
              disabled={isRunning || !selectedPolicy}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50">
              {isRunning
                ? <><Loader2 size={15} className="animate-spin" /> Running... {progress}%</>
                : <><Play size={15} /> Run All {rows.length} Rows</>
              }
            </button>
          </div>

          {/* Progress bar */}
          {isRunning && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Evaluating rows...</span>
                <span>{evaluated.length}/{rows.length}</span>
              </div>
              <div className="w-full bg-[#1e293b] rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      {rows.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e293b] flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">
              Results Table
              {evaluated.length > 0 && (
                <span className="ml-2 text-xs text-slate-500 font-normal">
                  {evaluated.length}/{rows.length} evaluated
                </span>
              )}
            </h3>
            <div className="flex gap-2 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mt-0.5" /> Allow
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block mt-0.5 ml-2" /> Deny
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block mt-0.5 ml-2" /> Flag
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#0a1120]">
                  <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium w-12">#</th>
                  {headers.map(h => (
                    <th key={h} className="text-left text-xs text-slate-500 px-4 py-3 font-medium">{h}</th>
                  ))}
                  <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Decision</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Rules</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const decision = row._result?.final_decision
                  const style = decision ? DECISION_STYLE[decision] : null
                  const Icon = style?.icon

                  return (
                    <tr key={i}
                      className={`border-b border-[#1e293b] transition-colors ${
                        decision === 'allow' ? 'hover:bg-emerald-500/5' :
                        decision === 'deny'  ? 'hover:bg-red-500/5' :
                        decision === 'flag'  ? 'hover:bg-amber-500/5' :
                        'hover:bg-[#1a2540]'
                      }`}>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{row._rowIndex}</td>
                      {headers.map(h => (
                        <td key={h} className="px-4 py-3 text-xs text-slate-300 font-mono">
                          {row[h] ?? '—'}
                        </td>
                      ))}

                      {/* Decision cell */}
                      <td className="px-4 py-3">
                        {row._result ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${style?.bg} ${style?.text} ${style?.border}`}>
                            {Icon && <Icon size={12} />}
                            {decision?.toUpperCase()}
                          </div>
                        ) : row._error ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-400">
                            <AlertCircle size={12} /> Error
                          </div>
                        ) : isRunning && i === evaluated.length ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-primary-400">
                            <Loader2 size={12} className="animate-spin" /> Running...
                          </div>
                        ) : (
                          <div className="w-16 h-5 bg-[#1e293b] rounded animate-pulse" />
                        )}
                      </td>

                      {/* Rules matched */}
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {row._result ? (
                          <span className="font-mono">
                            {row._result.rules_matched}
                            <span className="text-slate-600">/{row._result.rules_total}</span>
                          </span>
                        ) : '—'}
                      </td>

                      {/* Execution time */}
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">
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

      {/* How to use guide */}
      {rows.length === 0 && (
        <div className="card bg-[#0a1120] border-[#1a2a3a]">
          <h3 className="font-semibold text-white text-sm mb-4">📖 How to use?</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Download Sample', desc: 'Click "Download Sample" button and open the CSV to see format', color: 'text-blue-400 bg-blue-500/10' },
              { step: '2', title: 'Select Policy', desc: 'Choose which policy you want to evaluate your data against', color: 'text-purple-400 bg-purple-500/10' },
              { step: '3', title: 'Upload CSV', desc: 'Drag and drop your CSV file with data into the upload area', color: 'text-primary-400 bg-primary-500/10' },
              { step: '4', title: 'Run & Download', desc: 'Click "Run All Rows" — results will appear in the table below', color: 'text-emerald-400 bg-emerald-500/10' },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="text-center">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg font-bold mx-auto mb-3`}>
                  {step}
                </div>
                <div className="text-sm font-semibold text-white mb-1">{title}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}