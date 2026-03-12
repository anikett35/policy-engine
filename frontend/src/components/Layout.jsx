import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, Shield, Layers, ClipboardList,
  ScrollText, LogOut, Zap, FileSpreadsheet, Wand2, ChevronRight
} from 'lucide-react'
import ChatBot from './ChatBot'

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'AI Features',
    items: [
      { to: '/ai-generator',  label: 'AI Generator', icon: Wand2,          badge: 'NEW', highlight: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/policies',      label: 'Policies',     icon: Shield   },
      { to: '/rules',         label: 'Rules',        icon: Layers   },
    ],
  },
  {
    label: 'Evaluate',
    items: [
      { to: '/bulk-evaluate', label: 'Bulk Evaluate', icon: FileSpreadsheet, badge: 'CSV' },
      { to: '/evaluations',   label: 'Results',       icon: ClipboardList },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/logs',          label: 'Audit Logs',   icon: ScrollText },
    ],
  },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8f9fb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 232, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#fff', borderRight: '1px solid #e4e7ed',
        boxShadow: '1px 0 0 #f3f4f6',
      }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: '#4f6ef7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(79,110,247,0.3)',
            }}>
              <Zap size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>PolicyEngine</div>
              <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginTop: 1 }}>
                Rule System v2.0
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {NAV_SECTIONS.map(({ label, items }) => (
            <div key={label}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '0 8px', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map(({ to, label: itemLabel, icon: Icon, exact, badge, highlight }) => {
                  const isActive = exact
                    ? location.pathname === to
                    : location.pathname.startsWith(to)
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      end={exact}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '8px 10px', borderRadius: 10, textDecoration: 'none',
                        transition: 'all 0.13s',
                        background: isActive ? '#eef2ff' : 'transparent',
                        border: `1px solid ${isActive ? '#c7d2fe' : 'transparent'}`,
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive
                          ? '#dbe4ff'
                          : highlight
                            ? '#f5f3ff'
                            : '#f3f4f6',
                      }}>
                        <Icon
                          size={14}
                          color={
                            isActive    ? '#4f6ef7'
                            : highlight ? '#7c3aed'
                            : '#9ca3af'
                          }
                        />
                      </div>

                      {/* Label */}
                      <span style={{
                        flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 500,
                        color: isActive    ? '#3730a3'
                               : highlight ? '#7c3aed'
                               : '#374151',
                      }}>
                        {itemLabel}
                      </span>

                      {/* Badge */}
                      {badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                          background: highlight ? '#f5f3ff' : '#eef2ff',
                          color:      highlight ? '#7c3aed' : '#4f6ef7',
                          border: `1px solid ${highlight ? '#ddd6fe' : '#c7d2fe'}`,
                        }}>
                          {badge}
                        </span>
                      )}

                      {/* Active chevron */}
                      {isActive && <ChevronRight size={12} color="#4f6ef7" style={{ flexShrink: 0 }} />}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: '#f3f4f6', margin: '0 12px' }} />

        {/* User */}
        <div style={{ padding: '10px 10px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 10px', borderRadius: 11,
            background: '#f9fafb', border: '1px solid #f3f4f6',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: '#4f6ef7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.username}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'capitalize', marginTop: 1 }}>
                {user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9ca3af', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#9ca3af' }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </main>

      <ChatBot />
    </div>
  )
}