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
      { to: '/',             label: 'Dashboard',     icon: LayoutDashboard, exact: true },
    ]
  },
  {
    label: 'AI Features',
    items: [
      { to: '/ai-generator', label: 'AI Generator',  icon: Wand2,           badge: 'NEW', glow: true },
    ]
  },
  {
    label: 'Manage',
    items: [
      { to: '/policies',     label: 'Policies',      icon: Shield },
      { to: '/rules',        label: 'Rules',         icon: Layers },
    ]
  },
  {
    label: 'Evaluate',
    items: [
      { to: '/bulk-evaluate',label: 'Bulk Evaluate', icon: FileSpreadsheet, badge: 'CSV' },
      { to: '/evaluations',  label: 'Results',       icon: ClipboardList },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/logs',         label: 'Audit Logs',    icon: ScrollText },
    ]
  },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#04080f' }}>

      {/* ── Sidebar ── */}
      <aside className="w-64 flex flex-col flex-shrink-0 relative"
        style={{
          background: 'linear-gradient(180deg, #060c1a 0%, #04080f 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)'
        }}>

        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(79,110,247,0.4),transparent)' }} />

        {/* Logo */}
        <div className="p-5 mb-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4f6ef7,#6c3de8)', boxShadow: '0 0 20px rgba(79,110,247,0.4)' }}>
                <Zap size={17} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl animate-pulse-glow" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">PolicyEngine</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-medium">Rule System v2.0</div>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-4 pb-2">
          {NAV_SECTIONS.map(({ label, items }) => (
            <div key={label}>
              <div className="px-2 mb-1">
                <span className="text-[9px] text-slate-700 uppercase tracking-[0.15em] font-semibold">{label}</span>
              </div>
              <div className="space-y-0.5">
                {items.map(({ to, label: itemLabel, icon: Icon, exact, badge, glow }) => {
                  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
                  return (
                    <NavLink key={to} to={to} end={exact}
                      className={"nav-item " + (isActive ? 'nav-item-active' : 'nav-item-inactive')}>
                      <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 " + (!isActive ? 'bg-white/[0.04]' : '')}
                        style={isActive
                          ? { background: 'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(108,61,232,0.2))' }
                          : glow ? { background: 'rgba(124,58,237,0.15)' } : {}}>
                        <Icon size={14} className={
                          isActive ? 'text-indigo-300'
                          : glow   ? 'text-violet-400'
                          : 'text-slate-600'
                        } />
                      </div>
                      <span className={"flex-1 font-medium " + (isActive ? 'text-white' : glow ? 'text-violet-300' : '')}>{itemLabel}</span>
                      {badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                          style={glow
                            ? { background: 'rgba(124,58,237,0.25)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)' }
                            : { background: 'rgba(79,110,247,0.2)',  color: '#818cf8', border: '1px solid rgba(79,110,247,0.3)' }}>
                          {badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={12} className="text-indigo-400 flex-shrink-0" />}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mx-4 my-2 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

        {/* User */}
        <div className="p-3 pb-5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#4f6ef7,#6c3de8)' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.username}</div>
              <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto bg-grid relative">
        <div className="fixed top-0 right-0 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right,rgba(79,110,247,0.04) 0%,transparent 70%)' }} />
        <div className="fixed bottom-0 left-64 w-[400px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at bottom left,rgba(108,61,232,0.04) 0%,transparent 70%)' }} />
        <Outlet />
      </main>

      <ChatBot />
    </div>
  )
}