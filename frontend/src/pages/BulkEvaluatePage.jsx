import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPolicies, runEvaluation } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Box, Grid, Card, CardContent, Typography, Button, Select, MenuItem,
  FormControl, InputLabel, Chip, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, alpha,
} from '@mui/material'
import {
  CloudUpload, TableChart, PlayArrow, Download, CheckCircle, Cancel,
  Flag, Delete, Error as ErrorIcon, Description, HourglassEmpty,
} from '@mui/icons-material'

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
  deny:  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: Cancel,      rowBg: '#fff5f5' },
  flag:  { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: Flag,        rowBg: '#fffbeb' },
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
    if (!rows.length) { toast.error('Upload a file first'); return }
    setIsRunning(true); setProgress(0)
    const updated = [...rows]
    for (let i = 0; i < updated.length; i++) {
      const row = { ...updated[i] }
      delete row._rowIndex; delete row._result; delete row._error
      try {
        const result = await runEvaluation({ policy_id: selectedPolicy, input_data: row })
        updated[i] = { ...updated[i], _result: result, _error: null }
      } catch { updated[i] = { ...updated[i], _result: null, _error: 'Failed' } }
      setRows([...updated])
      setProgress(Math.round(((i + 1) / updated.length) * 100))
    }
    setIsRunning(false); toast.success('All rows evaluated!')
  }

  const handleDownload = () => {
    const csv = resultsToCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `results_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url); toast.success('Results downloaded!')
  }

  const clearAll = () => {
    setRows([]); setHeaders([]); setFileName(''); setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const evaluated = rows.filter(r => r._result)
  const allowCount = evaluated.filter(r => r._result?.final_decision === 'allow').length
  const denyCount = evaluated.filter(r => r._result?.final_decision === 'deny').length
  const flagCount = evaluated.filter(r => r._result?.final_decision === 'flag').length

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 }, minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2">Bulk Evaluation</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>Upload a CSV and evaluate all rows at once</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {rows.length > 0 && evaluated.length > 0 && (
            <Button variant="contained" startIcon={<Download />} onClick={handleDownload}>Download Results</Button>
          )}
          {rows.length > 0 && (
            <Button variant="outlined" startIcon={<Delete />} onClick={clearAll}>Clear</Button>
          )}
        </Box>
      </Box>

      {/* Config row */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Policy</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Policy</InputLabel>
                <Select value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)} label="Policy">
                  <MenuItem value="">Select a policy…</MenuItem>
                  {policies.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.25 }}>Sample CSV Template</Typography>
                <Typography variant="caption">Example file for Loan Policy testing</Typography>
              </Box>
              <Button variant="outlined" size="small" startIcon={<Download />}
                onClick={() => {
                  const sample = `age,credit_score,employment_status,monthly_salary\n25,750,employed,50000\n30,350,employed,40000\n28,600,unemployed,0`
                  const blob = new Blob([sample], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob); const a = document.createElement('a')
                  a.href = url; a.download = 'sample_loan_data.csv'; a.click(); URL.revokeObjectURL(url)
                  toast.success('Sample CSV downloaded!')
                }}>
                Download Sample
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload area */}
      {rows.length === 0 && (
        <Paper
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          sx={{
            border: `2px dashed ${dragOver ? '#4f6ef7' : '#d1d5db'}`,
            borderRadius: 3.5, p: { xs: 4, sm: 7 }, textAlign: 'center', cursor: 'pointer',
            bgcolor: dragOver ? alpha('#4f6ef7', 0.04) : 'background.paper',
            transition: 'all 0.15s', mb: 2.5,
            '&:hover': { borderColor: '#4f6ef7', bgcolor: alpha('#4f6ef7', 0.02) },
          }}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <Box sx={{ width: 64, height: 64, borderRadius: 4, bgcolor: dragOver ? alpha('#4f6ef7', 0.08) : 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <TableChart sx={{ fontSize: 30, color: dragOver ? 'primary.main' : 'text.disabled' }} />
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.75 }}>Drop your CSV file here</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>or click to browse</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, flexWrap: 'wrap' }}>
            {['First row = headers', 'Other rows = data', 'Headers match rule fields'].map(t => (
              <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Description sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption">{t}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* File loaded */}
      {rows.length > 0 && (
        <Card sx={{ mb: 2.5, border: '1px solid', borderColor: alpha('#4f6ef7', 0.3) }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: alpha('#4f6ef7', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TableChart sx={{ fontSize: 20, color: 'primary.main' }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 120 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{fileName}</Typography>
                <Typography variant="caption">{rows.length} rows · {headers.length} columns</Typography>
              </Box>
              {evaluated.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {[['allow', allowCount, CheckCircle], ['deny', denyCount, Cancel], ['flag', flagCount, Flag]].map(([type, count, Icon]) => {
                    const ds = DECISION_STYLES[type]
                    return (
                      <Chip key={type} icon={<Icon sx={{ fontSize: '15px !important' }} />} label={count} size="small"
                        sx={{ bgcolor: ds.bg, color: ds.text, border: `1px solid ${ds.border}`, fontWeight: 700, '& .MuiChip-icon': { color: ds.text } }} />
                    )
                  })}
                </Box>
              )}
              <Button variant="contained" startIcon={isRunning ? <HourglassEmpty sx={{ animation: 'spin 0.7s linear infinite' }} /> : <PlayArrow />}
                onClick={handleRunAll} disabled={isRunning || !selectedPolicy}
                sx={{ whiteSpace: 'nowrap' }}>
                {isRunning ? `Running… ${progress}%` : `Run ${rows.length} Rows`}
              </Button>
            </Box>
            {isRunning && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="caption">Evaluating…</Typography>
                  <Typography variant="caption">{evaluated.length} / {rows.length}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results table */}
      {rows.length > 0 && (
        <TableContainer component={Card}>
          <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              Results {evaluated.length > 0 && <Typography component="span" sx={{ fontSize: 12, color: 'text.disabled', fontWeight: 400, ml: 1 }}>{evaluated.length}/{rows.length} evaluated</Typography>}
            </Typography>
          </Box>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell sx={{ width: 40 }}>#</TableCell>
              {headers.map(h => <TableCell key={h}>{h}</TableCell>)}
              <TableCell>Decision</TableCell>
              <TableCell>Rules</TableCell>
              <TableCell>Time</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {rows.map((row, i) => {
                const decision = row._result?.final_decision
                const ds = decision ? DECISION_STYLES[decision] : null
                return (
                  <TableRow key={i} sx={{ bgcolor: ds ? ds.rowBg : 'inherit' }}>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{row._rowIndex}</TableCell>
                    {headers.map(h => <TableCell key={h} sx={{ fontFamily: 'monospace', color: 'text.primary' }}>{row[h] ?? '—'}</TableCell>)}
                    <TableCell>
                      {row._result ? (
                        <Chip icon={ds.icon ? <ds.icon sx={{ fontSize: '13px !important' }} /> : undefined} label={decision.toUpperCase()} size="small"
                          sx={{ fontWeight: 700, fontSize: 10, bgcolor: ds.bg, color: ds.text, border: `1px solid ${ds.border}`, '& .MuiChip-icon': { color: ds.text } }} />
                      ) : row._error ? (
                        <Chip icon={<ErrorIcon sx={{ fontSize: '13px !important' }} />} label="Error" size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary' }} />
                      ) : isRunning && i === evaluated.length ? (
                        <Chip label="Running" size="small" sx={{ bgcolor: alpha('#4f6ef7', 0.08), color: 'primary.main' }} />
                      ) : (
                        <Box sx={{ width: 60, height: 20, bgcolor: 'action.hover', borderRadius: 1.5 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {row._result ? <>{row._result.rules_matched}<Box component="span" sx={{ color: 'text.disabled' }}>/{row._result.rules_total}</Box></> : '—'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                      {row._result ? `${row._result.execution_time_ms}ms` : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}