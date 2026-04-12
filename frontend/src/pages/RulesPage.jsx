import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRules, getPolicies } from '../api/endpoints'
import { Link } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Select, MenuItem, FormControl,
  InputLabel, Chip, Skeleton, alpha,
} from '@mui/material'
import {
  Layers, ArrowForward, CheckCircle, Cancel, Flag,
} from '@mui/icons-material'

const DECISION_META = {
  allow: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: CheckCircle },
  deny:  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: Cancel },
  flag:  { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: Flag },
}

export default function RulesPage() {
  const { data: rules = [], isLoading } = useQuery({ queryKey: ['rules'], queryFn: () => getRules() })
  const { data: policies = [] } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })

  const [filter, setFilter] = useState('')

  const policyMap = Object.fromEntries(policies.map(p => [p.id, p.name]))
  const filtered = filter ? rules.filter(r => r.policy_id === filter) : rules
  const sorted = [...filtered].sort((a, b) => a.priority - b.priority)

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 }, minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2">All Rules</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            {filtered.length} rule{filtered.length !== 1 ? 's' : ''}{filter ? ' in selected policy' : ' across all policies'}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Policy</InputLabel>
          <Select value={filter} onChange={e => setFilter(e.target.value)} label="Policy">
            <MenuItem value="">All Policies</MenuItem>
            {policies.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Rules list */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={90} />)}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {sorted.map(r => {
            const actionType = r.actions?.[0]?.type
            const meta = DECISION_META[actionType] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed', icon: null }
            const ActionIcon = meta.icon

            return (
              <Card key={r.id} sx={{ position: 'relative', overflow: 'hidden' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  {/* Priority badge */}
                  <Box sx={{
                    width: 38, height: 38, borderRadius: 2.5, flexShrink: 0,
                    bgcolor: meta.bg, border: `1px solid ${meta.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: meta.text,
                  }}>
                    {r.priority}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Name row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>{r.name}</Typography>
                      <Chip label={r.is_active ? 'active' : 'inactive'} size="small"
                        sx={{ height: 18, fontSize: 10, bgcolor: r.is_active ? 'success.light' : 'action.hover', color: r.is_active ? 'success.dark' : 'text.secondary' }} />
                      <Chip label={r.logic} size="small" sx={{ height: 18, fontSize: 10, bgcolor: 'action.hover', color: 'text.disabled' }} />
                    </Box>

                    {/* Policy link */}
                    {policyMap[r.policy_id] && (
                      <Typography component={Link} to={`/policies/${r.policy_id}`}
                        sx={{ fontSize: 12, color: 'primary.main', textDecoration: 'none', display: 'inline-block', mb: 1, '&:hover': { textDecoration: 'underline' } }}>
                        {policyMap[r.policy_id]}
                      </Typography>
                    )}

                    {/* Conditions + action */}
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
                      {r.conditions?.length > 0 && <ArrowForward sx={{ fontSize: 13, color: 'text.disabled' }} />}
                      {r.actions?.map((a, i) => {
                        const am = DECISION_META[a.type] || { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed', icon: null }
                        return (
                          <Chip key={i} size="small" icon={am.icon ? <am.icon sx={{ fontSize: '13px !important' }} /> : undefined}
                            label={a.type.toUpperCase()}
                            sx={{ height: 24, fontWeight: 700, fontSize: 10, bgcolor: am.bg, color: am.text, border: `1px solid ${am.border}`, '& .MuiChip-icon': { color: am.text } }} />
                        )
                      })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )
          })}

          {sorted.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
              <Layers sx={{ fontSize: 48, mb: 1.5, opacity: 0.3 }} />
              <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 14, mb: 0.5 }}>No rules found</Typography>
              <Typography variant="body2">{filter ? 'This policy has no rules yet.' : 'Create a policy and add rules to get started.'}</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}