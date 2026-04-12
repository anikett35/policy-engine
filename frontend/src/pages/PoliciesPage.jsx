import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPolicies, createPolicy, deletePolicy } from '../api/endpoints'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Chip, Skeleton, InputAdornment,
  Collapse, CircularProgress, alpha, Tooltip, Paper,
} from '@mui/material'
import {
  Add, Delete, ChevronRight, Security, LocalOffer, Close, Search,
  FolderOpen, Lock, Storage, VpnKey, AttachMoney, Description,
} from '@mui/icons-material'

const CATEGORIES = ['Compliance', 'Security', 'Data Governance', 'Access Control', 'Financial', 'Other']

const CAT_META = {
  Compliance:        { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe', Icon: Lock },
  Security:          { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', Icon: Security },
  'Data Governance': { bg: '#e0f2fe', text: '#075985', border: '#bae6fd', Icon: Storage },
  'Access Control':  { bg: '#fef9c3', text: '#854d0e', border: '#fde047', Icon: VpnKey },
  Financial:         { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', Icon: AttachMoney },
  Other:             { bg: '#f3f4f6', text: '#374151', border: '#e4e7ed', Icon: Description },
}

export default function PoliciesPage() {
  const qc = useQueryClient()
  const { data: policies = [], isLoading } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })

  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [form, setForm] = useState({ name: '', description: '', category: 'Compliance', tags: '', status: 'draft' })

  const createMut = useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      qc.invalidateQueries(['policies'])
      setShowForm(false)
      setForm({ name: '', description: '', category: 'Compliance', tags: '', status: 'draft' })
      toast.success('Policy created!')
    },
    onError: () => toast.error('Failed to create policy.'),
  })

  const deleteMut = useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => { qc.invalidateQueries(['policies']); toast.success('Policy deleted') },
  })

  const filtered = policies.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter ? p.category === catFilter : true
    return matchSearch && matchCat
  })

  const handleSubmit = e => {
    e.preventDefault()
    createMut.mutate({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 }, minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2">Policies</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            {policies.length} total · {policies.filter(p => p.status === 'active').length} active
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setShowForm(v => !v)}>
          New Policy
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.25, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search policies…"
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Category</InputLabel>
          <Select value={catFilter} onChange={e => setCatFilter(e.target.value)} label="Category" sx={{ borderRadius: 2.5 }}>
            <MenuItem value="">All Categories</MenuItem>
            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Create Form */}
      <Collapse in={showForm}>
        <Card sx={{ mb: 2.5, border: '1px solid', borderColor: alpha('#4f6ef7', 0.3) }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h4">Create New Policy</Typography>
              <IconButton onClick={() => setShowForm(false)} size="small"><Close sx={{ fontSize: 18 }} /></IconButton>
            </Box>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Policy Name" required fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Loan Eligibility Policy" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} label="Category">{CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField label="Description" required fullWidth multiline rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this policy do?" sx={{ mb: 2 }} />
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Tags (comma separated)" fullWidth value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="loan, bank, kyc" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} label="Status">
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button type="submit" variant="contained" disabled={createMut.isPending} startIcon={createMut.isPending ? <CircularProgress size={14} color="inherit" /> : <Add />}>
                  {createMut.isPending ? 'Creating…' : 'Create Policy'}
                </Button>
                <Button variant="outlined" onClick={() => setShowForm(false)}>Cancel</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* Policy Grid */}
      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(i => <Grid item xs={12} sm={6} key={i}><Skeleton variant="rounded" height={160} /></Grid>)}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(p => {
            const cat = CAT_META[p.category] || CAT_META.Other
            const CatIcon = cat.Icon
            return (
              <Grid item xs={12} sm={6} key={p.id}>
                <Card sx={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Top accent */}
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: cat.bg, borderRadius: '14px 14px 0 0' }} />
                  <CardContent sx={{ pt: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.25 }}>
                      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: cat.bg, border: `1px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CatIcon sx={{ fontSize: 19, color: cat.text }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>{p.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                            <Chip label={p.status} size="small" sx={{ height: 18, fontSize: 10, bgcolor: p.status === 'active' ? 'success.light' : 'action.hover', color: p.status === 'active' ? 'success.dark' : 'text.secondary' }} />
                            <Typography variant="caption">v{p.version}</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Delete" arrow>
                          <IconButton size="small" onClick={e => { e.stopPropagation(); if (window.confirm('Delete this policy?')) deleteMut.mutate(p.id) }}
                            sx={{ '&:hover': { bgcolor: 'error.light', color: 'error.main' } }}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View details" arrow>
                          <IconButton component={Link} to={`/policies/${p.id}`} size="small"
                            sx={{ '&:hover': { bgcolor: alpha('#4f6ef7', 0.1), color: 'primary.main' } }}>
                            <ChevronRight sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.55, mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {p.tags?.slice(0, 3).map(t => (
                          <Chip key={t} icon={<LocalOffer sx={{ fontSize: '10px !important' }} />} label={t} size="small"
                            sx={{ height: 20, fontSize: 10, bgcolor: 'action.hover', color: 'text.disabled', '& .MuiChip-icon': { color: 'text.disabled', ml: 0.5 } }} />
                        ))}
                      </Box>
                      <Chip label={p.category} size="small" sx={{ height: 20, fontSize: 10, bgcolor: cat.bg, color: cat.text, fontWeight: 600 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}

          {filtered.length === 0 && !isLoading && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
                <FolderOpen sx={{ fontSize: 48, mb: 1.5, opacity: 0.4 }} />
                <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 14, mb: 0.5 }}>No policies found</Typography>
                <Typography variant="body2">Create your first policy to get started</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  )
}