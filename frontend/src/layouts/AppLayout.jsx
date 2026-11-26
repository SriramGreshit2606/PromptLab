import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Database, FileText, FlaskConical, FolderKanban, GitCompare, LayoutDashboard, ListChecks, LogOut, Menu, X } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { cx } from '../components/ui'

// Add entries here as each module is built. Every entry must point at a real route.
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/prompts', label: 'Prompts', icon: FileText },
  { to: '/datasets', label: 'Datasets', icon: Database },
  { to: '/playground', label: 'Testing Playground', icon: FlaskConical },
  { to: '/runs', label: 'Results', icon: ListChecks },
  { to: '/comparison', label: 'Comparison', icon: GitCompare },
]

function SidebarLinks({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) => cx(
            'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition',
            isActive ? 'border-accent/60 bg-raised text-fg' : 'border-transparent text-muted hover:bg-raised/60 hover:text-fg',
          )}
        >
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const initial = (user?.full_name || user?.email || '?').trim().charAt(0).toUpperCase()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-raised">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">{initial}</span>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:block">{user?.full_name}</span>
        <ChevronDown size={16} className="text-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-line bg-card p-2 shadow-2xl shadow-black/40">
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold">{user?.full_name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button role="menuitem" onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-raised hover:text-fg">
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-bg px-4 py-5 lg:flex">
        <Logo to="/dashboard" className="mb-8 px-2" />
        <SidebarLinks />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-bg px-4 py-5">
            <div className="mb-8 flex items-center justify-between px-2">
              <Logo to="/dashboard" />
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-muted hover:text-fg"><X size={20} /></button>
            </div>
            <SidebarLinks onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-8">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-muted hover:bg-raised hover:text-fg lg:hidden">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <UserMenu />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
