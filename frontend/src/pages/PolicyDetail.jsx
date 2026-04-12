import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPolicy, getRules, createRule, deleteRule, getMLSuggestions } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Box, Card, CardContent, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Chip, Switch, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails, Grid, CircularProgress,
  LinearProgress, Collapse, Tooltip, alpha, Skeleton,
} from '@mui/material'
import {
  Add, Delete, ChevronLeft, Layers, ArrowForward, Close, Settings,
  Psychology, Error as ErrorIcon, CheckCircle, ExpandMore, Bolt,
  Refresh, Info, Storage,
} from '@mui/icons-material'

const OPERATORS = ['equals','not_equals','greater_than','less_than','contains','not_contains','in','not_in','is_null','is_not_null']
const ACTION_TYPES = ['allow','deny','flag','notify','transform']
const emptyCondition = () => ({ field: '', operator: 'equals', value: '', data_type: 'string' })
const emptyAction = () => ({ type: 'allow', message: '', parameters: {} })

const ACTION_META = {
  allow:  { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  deny:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  flag:   { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  notify: { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
}

function ConfidenceBar({ value }) {
  const color = value >= 80 ? '#16a34a' : value >= 60 ? '#d97706' : '#dc2626'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress variant="determinate" value={value} sx={{ flex: 1, height: 5, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
      <Typography sx={{ fontSize: 11, fontWeight: 700, color, minWidth: 34, fontVariantNumeric: 'tabular-nums' }}>{value}%</Typography>
    </Box>
  )
}

function SuggestionCard({ suggestion, onApply, isApplied }) {
  const [expanded, setExpanded] = useState(false)
  const meta = ACTION_META[suggestion.suggested_action] || ACTION_META.notify
  return (
    <Card sx={{ border: `1px solid ${isApplied ? '#bbf7d0' : '#e4e7ed'}`, bgcolor: isApplied ? '#f0fdf4' : '#fff' }}>
      <CardContent sx={{ p: '12px 14px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25, flexWrap: 'wrap' }}>
          <Chip label={suggestion.field} size="small" sx={{ fontFamily: 'monospace', bgcolor: alpha('#4f6ef7', 0.08), color: '#3730a3', border: '1px solid #e0e7ff' }} />
          <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>{suggestion.operator}</Typography>
          <Chip label={suggestion.value} size="small" sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.primary', border: '1px solid', borderColor: 'divider' }} />
          <ArrowForward sx={{ fontSize: 12, color: 'text.disabled' }} />
          <Chip label={suggestion.suggested_action.toUpperCase()} size="small" sx={{ fontWeight: 700, bgcolor: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }} />
          {isApplied && <Chip icon={<CheckCircle sx={{ fontSize: '13px !important' }} />} label="Applied" size="small" sx={{ ml: 'auto', bgcolor: 'success.light', color: 'success.dark', fontWeight: 600, '& .MuiChip-icon': { color: 'success.dark' } }} />}
        </Box>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled' }}>ML Confidence</Typography>
            <Typography variant="caption">{suggestion.samples_affected} samples</Typography>
          </Box>
          <ConfidenceBar value={suggestion.confidence} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.5, flex: 1 }}>{suggestion.reason}</Typography>
          <IconButton size="small" onClick={() => setExpanded(e => !e)} sx={{ flexShrink: 0 }}>
            <ExpandMore sx={{ fontSize: 16, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </IconButton>
        </Box>
        <Collapse in={expanded}>
          <Box sx={{ mt: 1.25, pt: 1.25, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {[['Feature Importance', `${suggestion.importance}%`], ['Data Type', suggestion.data_type], ['Threshold', suggestion.value]].map(([l, v]) => (
              <Box key={l} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>{l}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>{v}</Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
        {!isApplied && (
          <Button fullWidth variant="outlined" size="small" startIcon={<Bolt sx={{ fontSize: 14 }} />} onClick={() => onApply(suggestion)}
            sx={{ mt: 1.25, bgcolor: meta.bg, color: meta.text, borderColor: meta.border, fontWeight: 600, '&:hover': { bgcolor: meta.bg, borderColor: meta.text, opacity: 0.9 } }}>
            Apply as Rule Condition
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function MLSuggestionPanel({ policyId, onApply, appliedFields }) {
  const [open, setOpen] = useState(false)
  const { data: mlData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['ml-suggestions', policyId], queryFn: () => getMLSuggestions(policyId), enabled: open, staleTime: 60_000,
  })
  const suggestions = mlData?.suggestions || []
  const modelInfo = mlData?.model_info || {}
  const status = mlData?.status

  return (
    <Accordion expanded={open} onChange={() => setOpen(o => !o)} sx={{ border: `1px solid ${alpha('#4f6ef7', 0.3)}`, bgcolor: '#fafbff' }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: alpha('#4f6ef7', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <Psychology sx={{ fontSize: 20, color: 'primary.main' }} />
            <Box sx={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', border: '2px solid #fafbff' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>ML Smart Rule Suggestions</Typography>
              <Chip label="Random Forest" size="small" sx={{ height: 18, fontSize: 10, bgcolor: alpha('#4f6ef7', 0.08), color: 'primary.main', border: `1px solid ${alpha('#4f6ef7', 0.2)}` }} />
              {suggestions.length > 0 && <Chip label={`${suggestions.length} suggestions ready`} size="small" sx={{ height: 18, fontSize: 10, bgcolor: 'success.light', color: 'success.dark', border: '1px solid', borderColor: alpha('#16a34a', 0.2) }} />}
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>AI analyzes past evaluations to suggest rule conditions automatically</Typography>
          </Box>
          {open && (
            <Tooltip title="Refresh" arrow>
              <IconButton onClick={e => { e.stopPropagation(); refetch() }} disabled={isFetching} size="small">
                <Refresh sx={{ fontSize: 16, animation: isFetching ? 'spin 0.7s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Training Random Forest on past evaluations…</Typography>
            </Box>
            {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={80} />)}
          </Box>
        )}
        {isError && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, bgcolor: 'error.light', border: '1px solid', borderColor: '#fca5a5', borderRadius: 2.5, p: 1.75 }}>
            <ErrorIcon sx={{ color: 'error.main' }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'error.main', mb: 0.25 }}>ML Service Error</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Unable to connect to backend ML service.</Typography>
            </Box>
          </Box>
        )}
        {!isLoading && !isError && status === 'insufficient_data' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Storage sx={{ fontSize: 40, color: 'text.disabled', mb: 1.25 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>Insufficient Training Data</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.disabled', mb: 1.5 }}>{mlData?.message}</Typography>
            <Chip icon={<Info sx={{ fontSize: '14px !important' }} />} label="Upload a CSV via Bulk Evaluate to generate data" sx={{ bgcolor: alpha('#4f6ef7', 0.08), color: 'primary.main', border: `1px solid ${alpha('#4f6ef7', 0.2)}`, '& .MuiChip-icon': { color: 'primary.main' } }} />
          </Box>
        )}
        {!isLoading && !isError && status === 'success' && (
          <>
            <Card sx={{ p: '10px 14px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', fontSize: 12 }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}><strong style={{ color: '#111827' }}>{modelInfo.n_evaluations || 0}</strong> evaluations trained</Typography>
                <Typography sx={{ color: 'divider' }}>·</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}><strong style={{ color: '#4f6ef7' }}>{modelInfo.n_trees || 10}</strong> decision trees</Typography>
                {modelInfo.top_features?.[0] && (
                  <>
                    <Typography sx={{ color: 'divider' }}>·</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Top field: <strong style={{ color: '#d97706', fontFamily: 'monospace' }}>{modelInfo.top_features[0].field}</strong></Typography>
                  </>
                )}
                <Typography sx={{ ml: 'auto', fontSize: 11, color: 'text.disabled' }}>
                  {suggestions.filter(s => appliedFields.has(s.field + s.operator + s.value)).length}/{suggestions.length} applied
                </Typography>
              </Box>
            </Card>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s} onApply={onApply} isApplied={appliedFields.has(s.field + s.operator + s.value)} />)}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, bgcolor: alpha('#4f6ef7', 0.06), border: `1px solid ${alpha('#4f6ef7', 0.2)}`, borderRadius: 2.5, p: 1.5 }}>
              <Info sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0, mt: 0.25 }} />
              <Typography sx={{ fontSize: 11, color: '#4338ca', lineHeight: 1.5 }}>
                Suggestions are derived from past evaluation patterns using a Random Forest model. Clicking Apply pre-fills the rule form — you can edit before saving.
              </Typography>
            </Box>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

export default function PolicyDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { data: policy } = useQuery({ queryKey: ['policy', id], queryFn: () => getPolicy(id) })
  const { data: rules = [] } = useQuery({ queryKey: ['rules', id], queryFn: () => getRules(id) })

  const [showForm, setShowForm] = useState(false)
  const [appliedFields, setAppliedFields] = useState(new Set())
  const [form, setForm] = useState({
    name: '', description: '', priority: 1, logic: 'AND',
    conditions: [emptyCondition()], actions: [emptyAction()], is_active: true,
  })

  const createMut = useMutation({
    mutationFn: data => createRule({ ...data, policy_id: id }),
    onSuccess: () => { qc.invalidateQueries(['rules', id]); setShowForm(false); toast.success('Rule created!') },
    onError: () => toast.error('Failed to create rule.'),
  })
  const deleteMut = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => { qc.invalidateQueries(['rules', id]); toast.success('Rule deleted') },
  })

  const addCondition = () => setForm(f => ({ ...f, conditions: [...f.conditions, emptyCondition()] }))
  const removeCondition = i => setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }))
  const updateCondition = (i, key, val) => setForm(f => ({ ...f, conditions: f.conditions.map((c, idx) => idx === i ? { ...c, [key]: val } : c) }))

  const handleSubmit = e => { e.preventDefault(); createMut.mutate(form) }

  const handleApplySuggestion = suggestion => {
    const key = suggestion.field + suggestion.operator + suggestion.value
    setAppliedFields(prev => new Set([...prev, key]))
    setShowForm(true)
    setForm(f => ({
      ...f,
      name: f.name || `${suggestion.field} ${suggestion.operator} ${suggestion.value}`,
      conditions: [...f.conditions.filter(c => c.field !== ''), { field: suggestion.field, operator: suggestion.operator, value: suggestion.value, data_type: suggestion.data_type }],
      actions: [{ type: suggestion.suggested_action, message: '', parameters: {} }],
    }))
    toast.success(`Applied: ${suggestion.field} ${suggestion.operator} ${suggestion.value}`)
    setTimeout(() => document.getElementById('rule-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  if (!policy) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
      <CircularProgress />
    </Box>
  )

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 }, minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 }, mb: 3, flexWrap: 'wrap' }}>
        <Tooltip title="Back to policies" arrow>
          <IconButton component={Link} to="/policies" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mt: 0.25 }}>
            <ChevronLeft />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h2">{policy.name}</Typography>
            <Chip label={policy.status} size="small" sx={{ bgcolor: policy.status === 'active' ? 'success.light' : 'action.hover', color: policy.status === 'active' ? 'success.dark' : 'text.secondary', fontWeight: 600 }} />
            <Typography variant="caption">v{policy.version}</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1 }}>{policy.description}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip label={policy.category} size="small" sx={{ bgcolor: alpha('#4f6ef7', 0.08), color: '#3730a3', fontWeight: 600, border: `1px solid ${alpha('#4f6ef7', 0.2)}` }} />
            {policy.tags?.map(t => <Chip key={t} label={t} size="small" sx={{ height: 20, fontSize: 10, bgcolor: 'action.hover', color: 'text.disabled' }} />)}
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setShowForm(true)} sx={{ flexShrink: 0 }}>
          Add Rule
        </Button>
      </Box>

      {/* ML Panel */}
      <Box sx={{ mb: 2.5 }}>
        <MLSuggestionPanel policyId={id} onApply={handleApplySuggestion} appliedFields={appliedFields} />
      </Box>

      {/* Add Rule Form */}
      <Collapse in={showForm}>
        <Card id="rule-form" sx={{ mb: 2.5, border: `1px solid ${alpha('#4f6ef7', 0.3)}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="h4">Create New Rule</Typography>
                {form.conditions.some(c => c.field !== '') && (
                  <Chip label="ML Pre-filled" size="small" sx={{ bgcolor: alpha('#4f6ef7', 0.08), color: 'primary.main', fontWeight: 700 }} />
                )}
              </Box>
              <IconButton onClick={() => setShowForm(false)} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}><TextField label="Rule Name" required fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Age Check" /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Priority" type="number" fullWidth InputProps={{ inputProps: { min: 1 } }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))} /></Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Logic Mode</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75 }}>
                    {['AND', 'OR'].map(l => (
                      <Button key={l} variant={form.logic === l ? 'contained' : 'outlined'} onClick={() => setForm(f => ({ ...f, logic: l }))} sx={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{l}</Button>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Switch checked={form.is_active} onChange={() => setForm(f => ({ ...f, is_active: !f.is_active }))} />} label="Active" sx={{ ml: 0 }} />
                </Grid>
              </Grid>

              {/* Conditions */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Conditions {form.conditions.some(c => c.field !== '') && <Typography component="span" sx={{ color: 'primary.main', textTransform: 'none', fontWeight: 500, fontSize: 'inherit' }}>(ML suggested)</Typography>}
                  </Typography>
                  <Button size="small" startIcon={<Add sx={{ fontSize: 13 }} />} onClick={addCondition}>Add Condition</Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {form.conditions.map((c, i) => (
                    <Grid container spacing={1} key={i} alignItems="center">
                      <Grid item xs={12} sm={3}><TextField fullWidth placeholder="field name" value={c.field} required onChange={e => updateCondition(i, 'field', e.target.value)} /></Grid>
                      <Grid item xs={6} sm={3}>
                        <FormControl fullWidth size="small"><Select value={c.operator} onChange={e => updateCondition(i, 'operator', e.target.value)}>
                          {OPERATORS.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                        </Select></FormControl>
                      </Grid>
                      <Grid item xs={6} sm={3}><TextField fullWidth placeholder="value" value={c.value} onChange={e => updateCondition(i, 'value', e.target.value)} /></Grid>
                      <Grid item xs={10} sm={2}>
                        <FormControl fullWidth size="small"><Select value={c.data_type} onChange={e => updateCondition(i, 'data_type', e.target.value)}>
                          <MenuItem value="string">string</MenuItem><MenuItem value="number">number</MenuItem><MenuItem value="boolean">boolean</MenuItem>
                        </Select></FormControl>
                      </Grid>
                      <Grid item xs={2} sm={1}>
                        <IconButton onClick={() => removeCondition(i)} disabled={form.conditions.length === 1} size="small"><Close sx={{ fontSize: 16 }} /></IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </Box>

              {/* Action type */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Action When Triggered</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {ACTION_TYPES.map(a => {
                    const meta = ACTION_META[a] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed' }
                    const selected = form.actions[0]?.type === a
                    return (
                      <Button key={a} variant="outlined" size="small" onClick={() => setForm(f => ({ ...f, actions: [{ ...f.actions[0], type: a }] }))}
                        sx={{ bgcolor: selected ? meta.bg : 'background.paper', color: selected ? meta.text : 'text.disabled', borderColor: selected ? meta.border : 'divider', fontWeight: 600, opacity: selected ? 1 : 0.7 }}>
                        {a}
                      </Button>
                    )
                  })}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
                <Button type="submit" variant="contained" disabled={createMut.isPending} startIcon={createMut.isPending ? <CircularProgress size={14} color="inherit" /> : <Add />}>
                  {createMut.isPending ? 'Creating…' : 'Create Rule'}
                </Button>
                <Button variant="outlined" onClick={() => setShowForm(false)}>Cancel</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* Rules list */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.75 }}>
          <Layers sx={{ fontSize: 17, color: 'text.disabled' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>{rules.length} Rules</Typography>
          {rules.length > 0 && <Typography variant="caption">· sorted by priority</Typography>}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {[...rules].sort((a, b) => a.priority - b.priority).map(r => {
            const meta = ACTION_META[r.actions?.[0]?.type] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed' }
            return (
              <Card key={r.id} sx={{ position: 'relative', overflow: 'hidden' }}>
                {/* Left accent */}
                <Box sx={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: '0 3px 3px 0', bgcolor: meta.border }} />
                <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 }, pl: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: meta.text, flexShrink: 0 }}>
                    {r.priority}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>{r.name}</Typography>
                      <Chip label={r.is_active ? 'active' : 'inactive'} size="small" sx={{ height: 18, fontSize: 10, bgcolor: r.is_active ? 'success.light' : 'action.hover', color: r.is_active ? 'success.dark' : 'text.secondary' }} />
                      <Chip label={r.logic} size="small" sx={{ height: 18, fontSize: 10, bgcolor: 'action.hover', color: 'text.disabled' }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      {r.conditions?.map((c, i) => (
                        <Chip key={i} size="small" variant="outlined" label={
                          <Box component="span" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                            <Box component="span" sx={{ color: 'primary.main' }}>{c.field}</Box>{' '}
                            <Box component="span" sx={{ color: 'text.disabled' }}>{c.operator}</Box>{' '}
                            <Box component="span" sx={{ fontWeight: 700 }}>{c.value}</Box>
                          </Box>
                        } sx={{ height: 26, borderColor: 'divider', bgcolor: 'background.default' }} />
                      ))}
                      {r.conditions?.length > 0 && <ArrowForward sx={{ fontSize: 12, color: 'text.disabled' }} />}
                      {r.actions?.map((a, i) => {
                        const am = ACTION_META[a.type] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed' }
                        return <Chip key={i} size="small" label={a.type} sx={{ fontWeight: 700, fontSize: 10, bgcolor: am.bg, color: am.text, border: `1px solid ${am.border}` }} />
                      })}
                    </Box>
                  </Box>
                  <Tooltip title="Delete rule" arrow>
                    <IconButton onClick={() => { if (window.confirm('Delete this rule?')) deleteMut.mutate(r.id) }} size="small"
                      sx={{ flexShrink: 0, '&:hover': { bgcolor: 'error.light', color: 'error.main' } }}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </CardContent>
              </Card>
            )
          })}

          {rules.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
              <Layers sx={{ fontSize: 48, mb: 1.5, opacity: 0.3 }} />
              <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 14, mb: 0.5 }}>No rules yet</Typography>
              <Typography variant="body2">Open the ML Suggestions panel or click "Add Rule" to create one</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}