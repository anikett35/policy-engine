import { useQuery } from '@tanstack/react-query'
import { getPolicies, getEvaluationStats, getEvaluations } from '../api/endpoints'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Skeleton,
  List, ListItemButton, ListItemIcon, ListItemText, Paper, alpha,
} from '@mui/material'
import {
  Security, Assessment, CheckCircle, Cancel, Flag, AccessTime,
  ArrowForward, TrendingUp, Bolt,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const PIE_COLORS = ['#16a34a', '#dc2626', '#d97706']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <Paper sx={{ px: 1.75, py: 1, boxShadow: 3, border: '1px solid', borderColor: 'divider' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', mb: 0.25 }}>{payload[0].name}</Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Count: <strong style={{ color: '#111827' }}>{payload[0].value}</strong>
      </Typography>
    </Paper>
  )
}

const DECISION_STYLES = {
  allow: { bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  deny:  { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  flag:  { bg: '#fef9c3', text: '#854d0e', dot: '#d97706' },
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { data: policies = [], isLoading: loadingPolicies } = useQuery({ queryKey: ['policies'], queryFn: getPolicies })
  const { data: stats, isLoading: loadingStats } = useQuery({ queryKey: ['eval-stats'], queryFn: getEvaluationStats })
  const { data: recent = [] } = useQuery({ queryKey: ['evaluations'], queryFn: () => getEvaluations() })

  const pieData = stats ? [
    { name: 'Eligible', value: stats.allow, color: PIE_COLORS[0] },
    { name: 'Not Eligible', value: stats.deny, color: PIE_COLORS[1] },
    { name: 'Under Review', value: stats.flag, color: PIE_COLORS[2] },
  ].filter(d => d.value > 0) : []

  const recentTrend = recent.slice(0, 14).reverse().map((e, i) => ({
    i,
    allow: e.final_decision === 'allow' ? 1 : 0,
    deny: e.final_decision === 'deny' ? 1 : 0,
  }))

  const statCards = [
    { label: 'Total Policies', value: policies.length, icon: Security, accent: '#4f6ef7', light: alpha('#4f6ef7', 0.1) },
    { label: 'Evaluations Run', value: stats?.total_evaluations ?? 0, icon: Assessment, accent: '#7c3aed', light: alpha('#7c3aed', 0.1) },
    { label: 'Eligible', value: stats?.allow ?? 0, icon: CheckCircle, accent: '#16a34a', light: '#dcfce7' },
    { label: 'Not Eligible', value: stats?.deny ?? 0, icon: Cancel, accent: '#dc2626', light: '#fee2e2' },
    { label: 'Under Review', value: stats?.flag ?? 0, icon: Flag, accent: '#d97706', light: '#fef9c3' },
    { label: 'Avg Speed', value: `${stats?.avg_execution_ms ?? 0}ms`, icon: AccessTime, accent: '#0891b2', light: '#e0f2fe' },
  ]

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 3.5 }, minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2">
            Welcome back, <Typography component="span" sx={{ color: 'primary.main', fontSize: 'inherit', fontWeight: 'inherit' }}>{user?.username}</Typography>
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>Here's your PolicyEngine overview.</Typography>
        </Box>
        <Button
          component={Link}
          to="/bulk-evaluate"
          variant="contained"
          startIcon={<Bolt sx={{ fontSize: 16 }} />}
        >
          Run Evaluation
        </Button>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {statCards.map(({ label, value, icon: Icon, accent, light }) => (
          <Grid item xs={6} sm={4} md={2} key={label}>
            {loadingStats ? (
              <Skeleton variant="rounded" height={90} />
            ) : (
              <Card sx={{ p: 0 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '16px !important' }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2.5, bgcolor: light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon sx={{ fontSize: 22, color: accent }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>{value}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>{label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* Pie Chart */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5">Decision Overview</Typography>
                  <Typography variant="caption">Eligibility breakdown</Typography>
                </Box>
                <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: alpha('#4f6ef7', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp sx={{ fontSize: 17, color: 'primary.main' }} />
                </Box>
              </Box>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72} dataKey="value" stroke="none" paddingAngle={3}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 1.5 }}>
                    {pieData.map(d => (
                      <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{d.name}</Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.primary' }}>{d.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
                  <Assessment sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2">No evaluations yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Area Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5">Evaluation Trend</Typography>
                  <Typography variant="caption">Recent evaluation history</Typography>
                </Box>
                {recentTrend.length > 0 && (
                  <Chip label={`Last ${recentTrend.length} evals`} size="small" sx={{ bgcolor: 'success.light', color: 'success.dark', fontWeight: 600, border: '1px solid', borderColor: alpha('#16a34a', 0.2) }} />
                )}
              </Box>
              {recentTrend.length > 1 ? (
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart data={recentTrend}>
                    <defs>
                      <linearGradient id="gAllow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gDeny" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e7ed', borderRadius: 10, fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="allow" name="Eligible" stroke="#16a34a" strokeWidth={2} fill="url(#gAllow)" />
                    <Area type="monotone" dataKey="deny" name="Denied" stroke="#dc2626" strokeWidth={2} fill="url(#gDeny)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
                  <Assessment sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2">Run evaluations to see trend</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={2}>
        {/* Recent Evaluations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h5">Recent Evaluations</Typography>
                <Button component={Link} to="/evaluations" size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} sx={{ fontSize: 12 }}>
                  View all
                </Button>
              </Box>
              <List disablePadding>
                {recent.slice(0, 5).map(ev => {
                  const ds = DECISION_STYLES[ev.final_decision] || DECISION_STYLES.allow
                  const DecIcon = ev.final_decision === 'allow' ? CheckCircle : ev.final_decision === 'deny' ? Cancel : Flag
                  return (
                    <ListItemButton key={ev.id} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', mb: 0.75, px: 1.5, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: ds.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <DecIcon sx={{ fontSize: 15, color: ds.text }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={ev.policy_name}
                        secondary={`${ev.rules_matched}/${ev.rules_total} rules · ${ev.execution_time_ms}ms`}
                        primaryTypographyProps={{ fontSize: 12, fontWeight: 600, noWrap: true }}
                        secondaryTypographyProps={{ fontSize: 11 }}
                      />
                      <Chip label={ev.final_decision} size="small" sx={{ bgcolor: ds.bg, color: ds.text, fontWeight: 600, fontSize: 10 }} />
                    </ListItemButton>
                  )
                })}
                {recent.length === 0 && (
                  <Typography sx={{ textAlign: 'center', color: 'text.disabled', fontSize: 12, py: 3 }}>
                    No evaluations yet. <Typography component={Link} to="/bulk-evaluate" sx={{ color: 'primary.main', textDecoration: 'none', fontSize: 'inherit' }}>Run one</Typography>
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Policies */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="h5">Your Policies</Typography>
                <Button component={Link} to="/policies" size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />} sx={{ fontSize: 12 }}>
                  Manage
                </Button>
              </Box>
              <List disablePadding>
                {policies.slice(0, 5).map(p => (
                  <ListItemButton key={p.id} component={Link} to={`/policies/${p.id}`} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', mb: 0.75, px: 1.5, py: 1, textDecoration: 'none' }}>
                    <ListItemIcon sx={{ minWidth: 38 }}>
                      <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: alpha('#4f6ef7', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Security sx={{ fontSize: 15, color: 'primary.main' }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={p.name}
                      secondary={`${p.category} · v${p.version}`}
                      primaryTypographyProps={{ fontSize: 12, fontWeight: 600, noWrap: true }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                    <Chip
                      label={p.status}
                      size="small"
                      sx={{
                        bgcolor: p.status === 'active' ? 'success.light' : 'action.hover',
                        color: p.status === 'active' ? 'success.dark' : 'text.secondary',
                        fontWeight: 600, fontSize: 10,
                      }}
                    />
                  </ListItemButton>
                ))}
                {policies.length === 0 && (
                  <Typography sx={{ textAlign: 'center', color: 'text.disabled', fontSize: 12, py: 3 }}>
                    No policies yet. <Typography component={Link} to="/policies" sx={{ color: 'primary.main', textDecoration: 'none', fontSize: 'inherit' }}>Create one</Typography>
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}