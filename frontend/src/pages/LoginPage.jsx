import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import {
  Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem,
  InputLabel, FormControl, IconButton, InputAdornment, CircularProgress,
  Grid, useMediaQuery, useTheme, Fade, alpha,
} from '@mui/material'
import {
  Visibility, VisibilityOff, Bolt, Security, Assessment, CheckCircle,
} from '@mui/icons-material'

const FEATURES = [
  { icon: Security, text: 'Policy Rule Engine' },
  { icon: Assessment, text: 'Bulk CSV Evaluation' },
  { icon: CheckCircle, text: 'Real-time Results' },
]

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'analyst' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuthStore()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const getErrMsg = (err) => {
    const detail = err.response?.data?.detail
    if (!detail) return 'Authentication failed'
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map(d => d.msg?.replace(/^Value error, /, '') ?? 'Validation error').join(' • ')
    }
    return 'Authentication failed'
  }

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.username, form.email, form.password, form.role)
      toast.success('Welcome to PolicyEngine!')
      navigate('/')
    } catch (err) {
      toast.error(getErrMsg(err))
    } finally {
      setLoading(false)
    }
  }

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      bgcolor: 'background.default',
    }}>
      {/* Left Hero Panel — hidden on mobile */}
      {!isMobile && (
        <Box sx={{
          width: '44%', flexShrink: 0,
          background: 'linear-gradient(160deg, #3d5af1 0%, #5b3ff8 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          p: { md: 5, lg: 6 },
        }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bolt sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 19, fontWeight: 700, color: '#fff' }}>PolicyEngine</Typography>
              <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Rule Evaluation System
              </Typography>
            </Box>
          </Box>

          {/* Hero */}
          <Box>
            <Typography component="h2" sx={{
              fontSize: { md: 32, lg: 40 }, fontWeight: 800, color: '#fff',
              lineHeight: 1.15, mb: 2, letterSpacing: '-0.5px',
            }}>
              Evaluate Rules.<br />Make Decisions.<br />At Scale.
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.65, mb: 4, maxWidth: 340 }}>
              Upload CSV files, define policies with conditions, and instantly get eligibility results for hundreds of applicants.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {FEATURES.map(({ icon: Icon, text }) => (
                <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 34, height: 34, borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon sx={{ fontSize: 17, color: '#fff' }} />
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 4.5 }}>
            {[['10+', 'Operators'], ['3', 'Decision Types'], ['∞', 'Evaluations']].map(([v, l]) => (
              <Box key={l}>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{v}</Typography>
                <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', mt: 0.25 }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Right Form Panel */}
      <Box sx={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: { xs: 3, sm: 5, md: 6 },
      }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 4, justifyContent: 'center' }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2.5,
                background: 'linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bolt sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary' }}>PolicyEngine</Typography>
            </Box>
          )}

          <Fade in>
            <Card sx={{ p: { xs: 2.5, sm: 3.5 }, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: '0 !important' }}>
                <Box sx={{ mb: 3.5 }}>
                  <Typography variant="h2" sx={{ mb: 0.75 }}>
                    {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <Typography
                      component="span"
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      sx={{ color: 'primary.main', fontWeight: 600, fontSize: 'inherit', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {mode === 'login' ? 'Register' : 'Sign in'}
                    </Typography>
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handle} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {mode === 'register' && (
                    <TextField
                      label="Username"
                      placeholder="johndoe"
                      value={form.username}
                      onChange={e => update('username', e.target.value)}
                      required
                      fullWidth
                    />
                  )}

                  <TextField
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    required
                    fullWidth
                  />

                  <TextField
                    label="Password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPw(s => !s)} edge="end" size="small">
                            {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {mode === 'register' && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={form.role}
                        onChange={e => update('role', e.target.value)}
                        label="Role"
                        sx={{ borderRadius: 2.5 }}
                      >
                        <MenuItem value="analyst">Analyst</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    size="large"
                    sx={{ mt: 1, py: 1.4, fontSize: 14, borderRadius: 2.5 }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={18} color="inherit" />
                        Please wait…
                      </Box>
                    ) : (
                      mode === 'login' ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Box>
      </Box>
    </Box>
  )
}