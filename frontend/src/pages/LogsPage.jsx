import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../api/endpoints'
import {
  Box, Grid, Card, CardContent, Typography, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, Skeleton, ToggleButton, ToggleButtonGroup, alpha,
} from '@mui/material'
import {
  Description, AddCircle, Refresh, Edit, Delete, PlayArrow, Person,
} from '@mui/icons-material'

const ACTION_CONFIG = {
  CREATE:   { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: AddCircle },
  UPDATE:   { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe', icon: Edit },
  DELETE:   { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: Delete },
  EVALUATE: { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: PlayArrow },
}

const ENTITY_COLORS = {
  policy:     { bg: alpha('#4f6ef7', 0.1), text: '#4f6ef7' },
  rule:       { bg: '#e0f2fe', text: '#0891b2' },
  evaluation: { bg: '#fef9c3', text: '#d97706' },
  user:       { bg: '#dcfce7', text: '#16a34a' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
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
    creates: logs.filter(l => l.action === 'CREATE').length,
    updates: logs.filter(l => l.action === 'UPDATE').length,
    deletes: logs.filter(l => l.action === 'DELETE').length,
    evals: logs.filter(l => l.action === 'EVALUATE').length,
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 }, minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2">Audit Logs</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>Every action tracked · {logs.length} entries</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()}>Refresh</Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={1.25} sx={{ mb: 2.5 }}>
        {[
          { label: 'Total', value: stats.total, bg: '#f3f4f6', text: '#374151' },
          { label: 'Created', value: stats.creates, bg: '#dcfce7', text: '#166534' },
          { label: 'Updated', value: stats.updates, bg: '#eef2ff', text: '#3730a3' },
          { label: 'Deleted', value: stats.deletes, bg: '#fee2e2', text: '#991b1b' },
          { label: 'Evaluations', value: stats.evals, bg: '#fef9c3', text: '#854d0e' },
        ].map(({ label, value, bg, text }) => (
          <Grid item xs={4} sm={2.4} key={label}>
            <Box sx={{ bgcolor: bg, borderRadius: 3, p: { xs: '12px 10px', sm: '14px 16px' }, textAlign: 'center' }}>
              <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 700, color: text }}>{value}</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>{label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.25, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Entity Type</InputLabel>
          <Select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} label="Entity Type">
            <MenuItem value="">All Entity Types</MenuItem>
            <MenuItem value="policy">Policies</MenuItem>
            <MenuItem value="rule">Rules</MenuItem>
            <MenuItem value="evaluation">Evaluations</MenuItem>
            <MenuItem value="user">Users</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup value={actionFilter} exclusive onChange={(_, v) => setActionFilter(v ?? '')} size="small">
          {['', 'CREATE', 'UPDATE', 'DELETE', 'EVALUATE'].map(a => (
            <ToggleButton key={a} value={a} sx={{
              fontSize: 12, px: 1.75, py: 0.75, fontWeight: 500, textTransform: 'none',
              '&.Mui-selected': { bgcolor: alpha('#4f6ef7', 0.08), color: 'primary.main', borderColor: 'primary.main' },
            }}>
              {a || 'All'}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Typography variant="caption" sx={{ ml: 'auto' }}>{filtered.length} entries</Typography>
      </Box>

      {/* Log entries */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={56} />)}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
          {filtered.map(log => {
            const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.CREATE
            const entCfg = ENTITY_COLORS[log.entity_type] || { bg: '#f3f4f6', text: '#374151' }
            const Icon = cfg.icon

            return (
              <Box key={log.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                {/* Icon */}
                <Box sx={{
                  width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
                  bgcolor: cfg.bg, border: `1px solid ${cfg.border}`,
                  alignItems: 'center', justifyContent: 'center',
                  display: { xs: 'none', sm: 'flex' },
                }}>
                  <Icon sx={{ fontSize: 17, color: cfg.text }} />
                </Box>

                {/* Card */}
                <Card sx={{ flex: 1 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', p: '10px 16px !important' }}>
                    <Chip label={log.action} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }} />
                    <Chip label={log.entity_type} size="small" sx={{ fontWeight: 600, fontSize: 10, bgcolor: entCfg.bg, color: entCfg.text, textTransform: 'capitalize' }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{log.entity_name}</Typography>
                    <Typography sx={{ color: 'divider', display: { xs: 'none', sm: 'block' } }}>·</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person sx={{ fontSize: 13, color: 'text.secondary' }} />
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{log.performed_by}</Typography>
                    </Box>
                    {Object.keys(log.details || {}).length > 0 && (
                      <Chip label={JSON.stringify(log.details)} size="small" sx={{ height: 20, fontSize: 10, fontFamily: 'monospace', bgcolor: 'action.hover', color: 'text.disabled', maxWidth: 240, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
                    )}
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{timeAgo(log.timestamp)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', display: { xs: 'none', md: 'block' } }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )
          })}

          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
              <Description sx={{ fontSize: 48, mb: 1.5, opacity: 0.3 }} />
              <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 14, mb: 0.5 }}>No audit logs yet</Typography>
              <Typography variant="body2">Actions will appear here automatically</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}