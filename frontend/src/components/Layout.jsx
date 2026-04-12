import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  Box, Drawer, AppBar, Toolbar, IconButton, Typography, Avatar,
  List, ListItemButton, ListItemIcon, ListItemText, Divider,
  Chip, useMediaQuery, useTheme, Tooltip, alpha,
} from '@mui/material'
import {
  Dashboard as DashboardIcon, Security, Layers, Assignment,
  Description, Logout, Bolt, TableChart, AutoAwesome,
  Menu as MenuIcon, ChevronRight,
} from '@mui/icons-material'
import ChatBot from './ChatBot'

const DRAWER_WIDTH = 252

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: DashboardIcon, exact: true },
    ],
  },
  {
    label: 'AI Features',
    items: [
      { to: '/ai-generator', label: 'AI Generator', icon: AutoAwesome, badge: 'NEW', highlight: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/policies', label: 'Policies', icon: Security },
      { to: '/rules', label: 'Rules', icon: Layers },
    ],
  },
  {
    label: 'Evaluate',
    items: [
      { to: '/bulk-evaluate', label: 'Bulk Evaluate', icon: TableChart, badge: 'CSV' },
      { to: '/evaluations', label: 'Results', icon: Assignment },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/logs', label: 'Audit Logs', icon: Description },
    ],
  },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(79,110,247,0.3)',
          }}>
            <Bolt sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              PolicyEngine
            </Typography>
            <Typography sx={{ fontSize: 9, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, mt: 0.25 }}>
              Rule System v2.0
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_SECTIONS.map(({ label, items }) => (
          <Box key={label}>
            <Typography sx={{ fontSize: 9, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.14em', px: 1.5, mb: 0.5 }}>
              {label}
            </Typography>
            <List dense disablePadding>
              {items.map(({ to, label: itemLabel, icon: Icon, exact, badge, highlight }) => {
                const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
                return (
                  <ListItemButton
                    key={to}
                    component={NavLink}
                    to={to}
                    end={exact || undefined}
                    selected={isActive}
                    onClick={() => isMobile && setMobileOpen(false)}
                    sx={{
                      borderRadius: 2.5,
                      mb: 0.25,
                      px: 1.5,
                      py: 0.9,
                      border: '1px solid transparent',
                      ...(isActive && {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box sx={{
                        width: 30, height: 30, borderRadius: 1.75,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : highlight ? alpha('#7c3aed', 0.08) : 'action.hover',
                      }}>
                        <Icon sx={{
                          fontSize: 16,
                          color: isActive ? 'primary.main' : highlight ? '#7c3aed' : 'text.disabled',
                        }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={itemLabel}
                      primaryTypographyProps={{
                        fontSize: 13, fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'primary.dark' : highlight ? '#7c3aed' : 'text.primary',
                      }}
                    />
                    {badge && (
                      <Chip
                        label={badge}
                        size="small"
                        sx={{
                          height: 18, fontSize: 9, fontWeight: 700,
                          bgcolor: highlight ? alpha('#7c3aed', 0.08) : alpha(theme.palette.primary.main, 0.08),
                          color: highlight ? '#7c3aed' : 'primary.main',
                          border: `1px solid ${highlight ? alpha('#7c3aed', 0.2) : alpha(theme.palette.primary.main, 0.2)}`,
                        }}
                      />
                    )}
                    {isActive && <ChevronRight sx={{ fontSize: 14, color: 'primary.main', ml: 0.5 }} />}
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* User */}
      <Box sx={{ p: 1.5 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.25,
          p: 1.25, borderRadius: 2.5,
          bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider',
        }}>
          <Avatar sx={{
            width: 34, height: 34, bgcolor: 'primary.main',
            fontSize: 13, fontWeight: 700,
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'text.disabled', textTransform: 'capitalize', mt: 0.25 }}>
              {user?.role}
            </Typography>
          </Box>
          <Tooltip title="Logout" arrow>
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                color: 'text.disabled',
                '&:hover': { bgcolor: 'error.light', color: 'error.main' },
              }}
            >
              <Logout sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Toolbar sx={{ minHeight: '56px !important', gap: 1.5 }}>
            <IconButton onClick={handleDrawerToggle} edge="start" size="small">
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: 1.75,
                background: 'linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bolt sx={{ fontSize: 14, color: '#fff' }} />
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>PolicyEngine</Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12, fontWeight: 700 }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          minHeight: '100vh',
          ...(isMobile && { mt: '56px' }),
        }}
      >
        <Outlet />
      </Box>

      <ChatBot />
    </Box>
  )
}