import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generatePolicy, previewPolicy } from '../api/endpoints'
import toast from 'react-hot-toast'
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, Chip,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress, alpha, Paper,
} from '@mui/material'
import {
  AutoAwesome, Save, Psychology, Layers, CheckCircle, Cancel, Flag,
  ContentCopy, Check, Error as ErrorIcon, Refresh, ArrowForward, LocalOffer,
  CreditCard, People, Favorite, VpnKey, ExpandMore,
} from '@mui/icons-material'

const EXAMPLE_PROMPTS = [
  { label: 'Loan Eligibility', icon: CreditCard, prompt: 'Create a loan eligibility policy. Approve applicants who are over 18 years old, have a credit score above 600, and are employed full-time. Deny applicants under 18, or with credit score below 300. Flag applications where credit score is between 300 and 600 for manual review.' },
  { label: 'KYC Compliance', icon: People, prompt: 'Create a KYC compliance policy. Allow users who have verified email, phone number, and government ID. Deny users with a risk score above 80 or accounts flagged as suspicious. Flag new users for review if any document is missing.' },
  { label: 'Health Insurance', icon: Favorite, prompt: 'Create a health insurance eligibility policy. Approve applicants aged 18 to 60 with no pre-existing chronic conditions and BMI under 35. Deny applicants above 70 years old. Flag applications from smokers or applicants with BMI over 30 for additional review.' },
  { label: 'Employee Access', icon: VpnKey, prompt: 'Create an employee system access control policy. Allow access to employees with active status, role set to admin or manager, and department in Engineering or Operations. Deny access to terminated employees. Flag contract workers for limited access review.' },
]

const ACTION_META = {
  allow: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', icon: CheckCircle, label: 'ALLOW' },
  deny:  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: Cancel,      label: 'DENY' },
  flag:  { bg: '#fef9c3', text: '#854d0e', border: '#fde047', icon: Flag,        label: 'FLAG' },
}

function RuleCard({ rule, defaultOpen }) {
  const meta = ACTION_META[rule.actions?.[0]?.type] || ACTION_META.allow

  return (
    <Accordion defaultExpanded={defaultOpen} sx={{ border: `1px solid #e4e7ed`, '&.Mui-expanded': { margin: 0 } }}>
      <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 1.75, minHeight: 48 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1 }}>
          <Box sx={{ width: 28, height: 28, borderRadius: 1.75, bgcolor: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: meta.text, flexShrink: 0 }}>{rule.priority}</Box>
          <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{rule.name}</Typography>
          {rule.description && <Typography variant="caption" sx={{ mr: 0.5, display: { xs: 'none', sm: 'block' } }}>{rule.description}</Typography>}
          <Chip icon={<meta.icon sx={{ fontSize: '12px !important' }} />} label={meta.label} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: meta.bg, color: meta.text, border: `1px solid ${meta.border}`, '& .MuiChip-icon': { color: meta.text } }} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.75, pt: 0 }}>
        <Typography variant="overline" sx={{ display: 'block', mb: 1, color: 'text.disabled' }}>Conditions ({rule.logic})</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.625 }}>
          {rule.conditions?.map((c, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip label={c.field} size="small" sx={{ fontFamily: 'monospace', bgcolor: alpha('#4f6ef7', 0.08), color: '#3730a3', border: '1px solid #e0e7ff' }} />
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>{c.operator}</Typography>
              <Chip label={c.value} size="small" sx={{ fontFamily: 'monospace', fontWeight: 600, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }} />
              <Chip label={c.data_type} size="small" sx={{ height: 18, fontSize: 10, bgcolor: 'action.hover', color: 'text.disabled' }} />
            </Box>
          ))}
        </Box>
        {rule.actions?.[0]?.message && (
          <Box sx={{ display: 'flex', gap: 0.75, mt: 1.25, alignItems: 'flex-start' }}>
            <ArrowForward sx={{ fontSize: 13, color: 'text.disabled', mt: 0.25, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11, fontStyle: 'italic', color: meta.text }}>{rule.actions[0].message}</Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

function PolicyPreview({ preview, onSave, isSaving }) {
  const [copied, setCopied] = useState(false)
  const { policy, rules = [] } = preview

  const counts = rules.reduce((acc, r) => { const t = r.actions?.[0]?.type || 'allow'; acc[t] = (acc[t] || 0) + 1; return acc }, {})

  const handleCopy = () => { navigator.clipboard.writeText(JSON.stringify(preview, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const CAT_COLOR = { Financial: { bg: '#dcfce7', text: '#166534' }, Compliance: { bg: '#eef2ff', text: '#3730a3' }, Security: { bg: '#fee2e2', text: '#991b1b' }, 'Access Control': { bg: '#fef9c3', text: '#854d0e' }, 'Data Governance': { bg: '#e0f2fe', text: '#075985' }, Other: { bg: '#f3f4f6', text: '#374151' } }
  const catStyle = CAT_COLOR[policy.category] || CAT_COLOR.Other

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Card><CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{policy.name}</Typography>
              <Chip label="draft" size="small" sx={{ height: 18, fontSize: 10, bgcolor: 'action.hover', color: 'text.secondary' }} />
            </Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>{policy.description}</Typography>
          </Box>
          <Chip label={policy.category} size="small" sx={{ bgcolor: catStyle.bg, color: catStyle.text, fontWeight: 600, flexShrink: 0 }} />
        </Box>
        {policy.tags?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.625, flexWrap: 'wrap', mb: 1.5 }}>
            {policy.tags.map(t => <Chip key={t} icon={<LocalOffer sx={{ fontSize: '10px !important' }} />} label={t} size="small" sx={{ height: 20, fontSize: 10, bgcolor: 'action.hover', color: 'text.disabled', '& .MuiChip-icon': { color: 'text.disabled', ml: 0.5 } }} />)}
          </Box>
        )}
        <Grid container spacing={1}>
          {[['allow', 'Eligible'], ['deny', 'Denied'], ['flag', 'Review']].map(([type, label]) => {
            const m = ACTION_META[type]
            return (
              <Grid item xs={4} key={type}>
                <Box sx={{ bgcolor: m.bg, border: `1px solid ${m.border}`, borderRadius: 2.5, p: '8px 10px', textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: m.text }}>{counts[type] || 0}</Typography>
                  <Typography sx={{ fontSize: 10, color: m.text, mt: 0.25 }}>{label} rules</Typography>
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </CardContent></Card>

      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <Layers sx={{ fontSize: 15, color: 'text.disabled' }} />
          <Typography variant="subtitle2">{rules.length} Generated Rules</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
          {rules.map((r, i) => <RuleCard key={i} rule={r} defaultOpen={i === 0} />)}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" fullWidth onClick={onSave} disabled={isSaving} startIcon={isSaving ? <CircularProgress size={14} color="inherit" /> : <Save />} sx={{ py: 1.4 }}>
          {isSaving ? 'Saving...' : 'Save Policy & Rules'}
        </Button>
        <Button variant="outlined" onClick={handleCopy} startIcon={copied ? <Check sx={{ color: 'success.main' }} /> : <ContentCopy />} sx={{ px: 2 }}>
          {copied ? 'Copied' : 'JSON'}
        </Button>
      </Box>
    </Box>
  )
}

function GeneratingState() {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 9 }}>
      <Box sx={{ width: 60, height: 60, borderRadius: 4, bgcolor: alpha('#4f6ef7', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Psychology sx={{ fontSize: 28, color: 'primary.main' }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.75 }}>Generating your policy…</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Building rules, conditions &amp; actions</Typography>
      <Box sx={{ display: 'flex', gap: 0.75 }}>
        {[0, 1, 2, 3].map(i => (
          <Box key={i} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </Box>
    </Card>
  )
}

export default function AIGeneratorPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const textareaRef = useRef(null)

  const [prompt, setPrompt] = useState('')
  const [preview, setPreview] = useState(null)
  const [generating, setGenerating] = useState(false)

  const previewMut = useMutation({
    mutationFn: (p) => previewPolicy({ prompt: p }),
    onMutate: () => { setGenerating(true); setPreview(null) },
    onSuccess: (data) => { setPreview(data); setGenerating(false) },
    onError: (err) => { setGenerating(false); toast.error(err.response?.data?.detail || 'Generation failed.') },
  })

  const saveMut = useMutation({
    mutationFn: (p) => generatePolicy({ prompt: p, save_to_db: true }),
    onSuccess: (data) => { qc.invalidateQueries(['policies']); toast.success(`"${data.policy_name}" saved with ${data.rules_count} rules!`); navigate(`/policies/${data.policy_id}`) },
    onError: (err) => toast.error(err.response?.data?.detail || 'Save failed.'),
  })

  const handleGenerate = () => {
    if (prompt.trim().length < 10) { toast.error('Please write at least one sentence.'); return }
    previewMut.mutate(prompt)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }
  const isDisabled = generating || saveMut.isPending || prompt.trim().length < 10

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 }, minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: 'linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AutoAwesome sx={{ fontSize: 20, color: '#fff' }} />
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h3">AI Policy Generator</Typography>
            <Chip label="Powered by Claude" size="small" sx={{ bgcolor: alpha('#4f6ef7', 0.08), color: 'primary.main', border: `1px solid ${alpha('#4f6ef7', 0.2)}`, fontWeight: 700, fontSize: 10 }} />
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>Describe your policy in plain English — AI generates rules, conditions &amp; actions.</Typography>
        </Box>
      </Box>

      {/* Two-column layout */}
      <Grid container spacing={2.5} alignItems="flex-start">
        {/* Left: Input */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Try an example</Typography>
              <Grid container spacing={0.875}>
                {EXAMPLE_PROMPTS.map(ex => {
                  const ExIcon = ex.icon
                  return (
                    <Grid item xs={6} key={ex.label}>
                      <Button fullWidth variant="outlined" onClick={() => { setPrompt(ex.prompt); setPreview(null); textareaRef.current?.focus() }}
                        startIcon={<ExIcon sx={{ fontSize: '16px !important' }} />}
                        sx={{ justifyContent: 'flex-start', fontSize: 12, fontWeight: 600, color: 'text.primary', borderColor: 'divider', py: 1.25, '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#4f6ef7', 0.04) } }}>
                        {ex.label}
                      </Button>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>Policy Description</Typography>
                <Typography variant="caption">{prompt.length} chars</Typography>
              </Box>
              <TextField
                inputRef={textareaRef} value={prompt}
                onChange={e => { setPrompt(e.target.value); setPreview(null) }}
                onKeyDown={handleKeyDown}
                multiline rows={9} fullWidth
                placeholder={'Describe your policy in plain English…\n\nExample:\n"Approve applicants over 18 with credit score above 600. Deny anyone under 18 or with score below 300. Flag borderline cases for manual review."'}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
              />
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                <Box component="kbd" sx={{ bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 1.25, px: 0.75, py: 0.125, fontSize: 10 }}>Cmd Enter</Box> to generate
              </Typography>
            </Box>

            <Button variant="contained" fullWidth onClick={handleGenerate} disabled={isDisabled} startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
              sx={{ py: 1.5, fontSize: 14 }}>
              {generating ? 'Generating…' : 'Generate Policy with AI'}
            </Button>
          </Box>
        </Grid>

        {/* Right: Output */}
        <Grid item xs={12} md={6}>
          {!generating && !preview && (
            <Paper sx={{ border: '2px dashed', borderColor: 'divider', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 9, minHeight: { md: 360 } }}>
              <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                <AutoAwesome sx={{ fontSize: 22, color: 'text.disabled' }} />
              </Box>
              <Typography sx={{ fontWeight: 600, color: 'text.disabled', fontSize: 13 }}>Policy preview will appear here</Typography>
              <Typography variant="caption" sx={{ mt: 0.5 }}>Write a description and click generate</Typography>
            </Paper>
          )}
          {generating && <GeneratingState />}
          {!generating && preview?.status === 'success' && (
            <PolicyPreview preview={preview.preview} onSave={() => saveMut.mutate(prompt)} isSaving={saveMut.isPending} />
          )}
          {!generating && preview && preview.status !== 'success' && (
            <Card sx={{ border: '1px solid #fca5a5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 3.5, px: 2 }}>
              <ErrorIcon sx={{ fontSize: 32, color: 'error.main' }} />
              <Typography sx={{ fontWeight: 600, color: 'error.main', fontSize: 14 }}>Generation Failed</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>{preview.message}</Typography>
              <Button onClick={() => setPreview(null)} startIcon={<Refresh />} size="small" sx={{ mt: 0.5, color: 'text.secondary' }}>Try again</Button>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}