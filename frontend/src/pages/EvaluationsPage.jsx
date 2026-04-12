import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getEvaluation, getEvaluationStats } from '../api/endpoints'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  Box, Grid, Card, CardContent, Typography, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Select, MenuItem, FormControl, InputLabel, Collapse,
  IconButton, InputAdornment, CircularProgress, Paper, Skeleton, alpha,
} from '@mui/material'
import {
  CheckCircle, Cancel, Flag, AccessTime, ExpandMore, ChevronRight,
  Bolt, Search, SwapVert, VerifiedUser, GppBad, Warning, BarChart as BarChartIcon, People,
} from '@mui/icons-material'

const DECISION_META = {
  allow: { label: 'Eligible', color: '#16a34a', bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: VerifiedUser },
  deny:  { label: 'Not Eligible', color: '#dc2626', bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: GppBad },
  flag:  { label: 'Under Review', color: '#d97706', bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: Warning },
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <Paper sx={{ px: 1.75, py: 1, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.25 }}>{payload[0].name}</Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Count: <strong>{payload[0].value}</strong></Typography>
    </Paper>
  )
}

export default function EvaluationsPage() {
  const { data: evaluations = [], isLoading } = useQuery({ queryKey: ['evaluations'], queryFn: () => getEvaluations() })
  const { data: stats } = useQuery({ queryKey: ['eval-stats'], queryFn: getEvaluationStats })

  const [activeTab, setActiveTab] = useState(0)
  const [selectedPolicy, setSelectedPolicy] = useState('all')
  const [decisionFilter, setDecisionFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const policies = useMemo(() => {
    const map = {}
    evaluations.forEach(e => { map[e.policy_id] = e.policy_name })
    return Object.entries(map).map(([id, name]) => ({ id, name }))
  }, [evaluations])

  const filtered = useMemo(() => {
    let list = [...evaluations]
    if (selectedPolicy !== 'all') list = list.filter(e => e.policy_id === selectedPolicy)
    if (decisionFilter !== 'all') list = list.filter(e => e.final_decision === decisionFilter)
    if (search) list = list.filter(e => e.policy_name.toLowerCase().includes(search.toLowerCase()) || e.evaluated_by.toLowerCase().includes(search.toLowerCase()))
    list.sort((a, b) => {
      let va, vb
      if (sortBy === 'date') { va = new Date(a.evaluated_at); vb = new Date(b.evaluated_at) }
      else if (sortBy === 'decision') { va = a.final_decision; vb = b.final_decision }
      else { va = a.rules_matched; vb = b.rules_matched }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
    return list
  }, [evaluations, selectedPolicy, decisionFilter, search, sortBy, sortDir])

  const pieData = [
    { name: 'Eligible', value: stats?.allow ?? 0, color: '#16a34a' },
    { name: 'Not Eligible', value: stats?.deny ?? 0, color: '#dc2626' },
    { name: 'Under Review', value: stats?.flag ?? 0, color: '#d97706' },
  ].filter(d => d.value > 0)

  const barData = useMemo(() => {
    const map = {}
    evaluations.forEach(e => {
      if (!map[e.policy_name]) map[e.policy_name] = { name: e.policy_name, allow: 0, deny: 0, flag: 0 }
      map[e.policy_name][e.final_decision]++
    })
    return Object.values(map)
  }, [evaluations])

  const toggleSort = field => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  if (isLoading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 1.5 }} />
        <Typography color="text.secondary">Loading evaluations…</Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 }, minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2">Evaluation Results</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>{evaluations.length} total evaluations across {policies.length} policies</Typography>
        </Box>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ bgcolor: 'action.hover', borderRadius: 2.5, p: 0.5, minHeight: 40, '& .MuiTab-root': { minHeight: 36 } }}>
          <Tab icon={<BarChartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Dashboard" sx={{ fontSize: 12 }} />
          <Tab icon={<People sx={{ fontSize: 16 }} />} iconPosition="start" label="All Results" sx={{ fontSize: 12 }} />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
          <Grid container spacing={1.5}>
            {[
              { label: 'Total Evaluated', value: stats?.total_evaluations ?? 0, icon: Bolt, bg: alpha('#4f6ef7', 0.1), color: '#4f6ef7' },
              { label: 'Eligible', value: stats?.allow ?? 0, icon: VerifiedUser, bg: '#dcfce7', color: '#16a34a' },
              { label: 'Not Eligible', value: stats?.deny ?? 0, icon: GppBad, bg: '#fee2e2', color: '#dc2626' },
              { label: 'Under Review', value: stats?.flag ?? 0, icon: Warning, bg: '#fef9c3', color: '#d97706' },
            ].map(({ label, value, icon: Icon, bg, color }) => (
              <Grid item xs={6} md={3} key={label}>
                <Card>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.75, p: '18px !important' }}>
                    <Box sx={{ width: 46, height: 46, bgcolor: bg, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon sx={{ fontSize: 22, color }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{value}</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{label}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card><CardContent>
                <Typography variant="h5" sx={{ mb: 0.5 }}>Decision Distribution</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>Overall eligibility breakdown</Typography>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={86} dataKey="value" stroke="none" paddingAngle={3}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie><RechartsTooltip content={<ChartTooltip />} /></PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.25, flexWrap: 'wrap', mt: 1 }}>
                      {pieData.map(d => (
                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: d.color }} />
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{d.name}</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{d.value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                ) : <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>No data yet</Box>}
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card><CardContent>
                <Typography variant="h5" sx={{ mb: 0.5 }}>Results by Policy</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>Allow / Deny / Flag per policy</Typography>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
                      <Bar dataKey="allow" name="Eligible" fill="#16a34a" radius={[4,4,0,0]} />
                      <Bar dataKey="deny" name="Not Eligible" fill="#dc2626" radius={[4,4,0,0]} />
                      <Bar dataKey="flag" name="Under Review" fill="#d97706" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>No data yet</Box>}
              </CardContent></Card>
            </Grid>
          </Grid>

          {filtered.filter(e => e.final_decision === 'allow').length > 0 && (
            <Card><CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ mb: 0.25 }}>Eligible Applicants</Typography>
                  <Typography variant="caption">Ranked by most rules passed</Typography>
                </Box>
                <Chip label={`${filtered.filter(e => e.final_decision === 'allow').length} eligible`} size="small" sx={{ bgcolor: 'success.light', color: 'success.dark', fontWeight: 700, border: '1px solid', borderColor: alpha('#16a34a', 0.2) }} />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow>
                    {['Rank', 'Policy', 'Rules Passed', 'Speed', 'Evaluated By', 'Date'].map(h => <TableCell key={h}>{h}</TableCell>)}
                  </TableRow></TableHead>
                  <TableBody>
                    {filtered.filter(e => e.final_decision === 'allow').sort((a, b) => b.rules_matched - a.rules_matched).map((ev, i) => (
                      <TableRow key={ev.id} hover>
                        <TableCell><Box sx={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, bgcolor: i === 0 ? '#fef9c3' : i === 1 ? '#f3f4f6' : i === 2 ? '#fed7aa' : '#f9fafb', color: i === 0 ? '#854d0e' : i === 1 ? '#374151' : i === 2 ? '#7c2d12' : '#6b7280' }}>{i + 1}</Box></TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{ev.policy_name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 64, bgcolor: 'action.hover', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                              <Box sx={{ width: ev.rules_total ? `${(ev.rules_matched/ev.rules_total)*100}%` : '0%', height: '100%', bgcolor: 'success.main', borderRadius: 99 }} />
                            </Box>
                            <Typography sx={{ fontFamily: 'monospace', color: 'success.main', fontWeight: 600, fontSize: 12 }}>{ev.rules_matched}/{ev.rules_total}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace', color: 'text.secondary', fontSize: 12 }}><AccessTime sx={{ fontSize: 13 }} />{ev.execution_time_ms}ms</Box></TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{ev.evaluated_by}</TableCell>
                        <TableCell sx={{ color: 'text.disabled' }}>{new Date(ev.evaluated_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent></Card>
          )}
        </Box>
      )}

      {/* List Tab */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <Card sx={{ p: '12px 16px' }}><Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField value={search} onChange={e => setSearch(e.target.value)} placeholder="Search policy or user…" sx={{ flex: 1, minWidth: 180 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }} />
            <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Policy</InputLabel>
              <Select value={selectedPolicy} onChange={e => setSelectedPolicy(e.target.value)} label="Policy"><MenuItem value="all">All Policies</MenuItem>{policies.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}</Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Decision</InputLabel>
              <Select value={decisionFilter} onChange={e => setDecisionFilter(e.target.value)} label="Decision"><MenuItem value="all">All Decisions</MenuItem><MenuItem value="allow">Eligible</MenuItem><MenuItem value="deny">Not Eligible</MenuItem><MenuItem value="flag">Under Review</MenuItem></Select>
            </FormControl>
            <Typography variant="caption" sx={{ ml: 0.5 }}>{filtered.length} results</Typography>
          </Box></Card>

          <TableContainer component={Card}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Decision</TableCell>
                <TableCell onClick={() => toggleSort('date')} sx={{ cursor: 'pointer' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>Date <SwapVert sx={{ fontSize: 12 }} /></Box></TableCell>
                <TableCell>Policy</TableCell>
                <TableCell onClick={() => toggleSort('rules')} sx={{ cursor: 'pointer' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>Rules <SwapVert sx={{ fontSize: 12 }} /></Box></TableCell>
                <TableCell>Time</TableCell>
                <TableCell>By</TableCell>
                <TableCell sx={{ width: 36 }} />
              </TableRow></TableHead>
              <TableBody>
                {filtered.map(ev => {
                  const meta = DECISION_META[ev.final_decision]
                  const Icon = meta?.icon
                  const isOpen = expandedId === ev.id
                  return (
                    <Box component="tbody" key={ev.id}>
                      <TableRow hover onClick={() => setExpandedId(isOpen ? null : ev.id)} sx={{ cursor: 'pointer' }}>
                        <TableCell><Chip icon={Icon ? <Icon sx={{ fontSize: '13px !important' }} /> : undefined} label={meta?.label} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: meta?.bg, color: meta?.text, border: `1px solid ${meta?.border}`, '& .MuiChip-icon': { color: meta?.text } }} /></TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{new Date(ev.evaluated_at).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{ev.policy_name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 48, bgcolor: 'action.hover', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                              <Box sx={{ width: ev.rules_total ? `${(ev.rules_matched/ev.rules_total)*100}%` : '0%', height: '100%', bgcolor: meta?.color, borderRadius: 99 }} />
                            </Box>
                            <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 11 }}>{ev.rules_matched}/{ev.rules_total}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.disabled', fontSize: 12 }}>{ev.execution_time_ms}ms</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{ev.evaluated_by}</TableCell>
                        <TableCell>{isOpen ? <ExpandMore sx={{ fontSize: 16, color: 'text.disabled' }} /> : <ChevronRight sx={{ fontSize: 16, color: 'text.disabled' }} />}</TableCell>
                      </TableRow>
                      <TableRow><TableCell colSpan={7} sx={{ p: 0, borderBottom: isOpen ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <Collapse in={isOpen}><Box sx={{ p: 2, bgcolor: 'background.default' }}><EvalDetail evalId={ev.id} /></Box></Collapse>
                      </TableCell></TableRow>
                    </Box>
                  )
                })}
              </TableBody>
            </Table>
            {filtered.length === 0 && <Box sx={{ textAlign: 'center', py: 5, color: 'text.disabled' }}>No evaluations match your filters.</Box>}
          </TableContainer>
        </Box>
      )}
    </Box>
  )
}

function EvalDetail({ evalId }) {
  const { data, isLoading } = useQuery({ queryKey: ['eval', evalId], queryFn: () => getEvaluation(evalId), staleTime: 60000 })
  if (isLoading) return <Typography sx={{ fontSize: 12, color: 'text.disabled', py: 1.5 }}>Loading…</Typography>
  if (!data) return null

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>Input Data</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(data.input_data).map(([k, v]) => (
            <Card key={k} sx={{ p: '8px 14px' }}>
              <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 0.25 }}>{k}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{v}</Typography>
            </Card>
          ))}
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>Rule Breakdown</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {data.results?.map((r, i) => (
            <Card key={i} sx={{ p: '10px 14px', border: `1px solid ${r.matched ? '#bbf7d0' : '#e4e7ed'}`, bgcolor: r.matched ? '#f0fdf4' : 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.matched ? 'success.main' : 'text.disabled', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{r.rule_name}</Typography>
                {r.matched && r.actions_triggered.map(a => (
                  <Chip key={a} label={a} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: DECISION_META[a]?.bg || '#f3f4f6', color: DECISION_META[a]?.text || '#374151' }} />
                ))}
              </Box>
              {r.conditions_evaluated?.map((c, j) => (
                <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 2, fontSize: 11, fontFamily: 'monospace', mt: 0.5 }}>
                  <Typography sx={{ color: c.passed ? 'success.main' : 'error.main', fontWeight: 700, fontSize: 11 }}>{c.passed ? '✓' : '✗'}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{c.field}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>{c.operator}</Typography>
                  <Typography sx={{ fontSize: 11 }}>{String(c.expected)}</Typography>
                  <Typography sx={{ color: 'text.disabled' }}>→</Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: c.passed ? 'success.main' : 'error.main' }}>{String(c.actual ?? 'null')}</Typography>
                </Box>
              ))}
            </Card>
          ))}
        </Box>
      </Grid>
    </Grid>
  )
}