import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ensureSupabaseSession } from '@/lib/persistence'
import store from '@/data/store'
import type { UserRole } from '@/types'
import { BrandLogo } from '@/components/BrandLogo'
import { CloudStatusBadge } from '@/components/CloudStatus'
import { getDashboardRoute, isUserRole, readSession } from '@/lib/session'

function isDashboardRole(role: string | undefined): role is UserRole {
  return role === 'organizer' || role === 'participant' || role === 'volunteer' || role === 'sponsor'
}

const ROLES: UserRole[] = ['organizer', 'participant', 'volunteer', 'sponsor']

export function DashboardLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading, isAuthenticated, continueAs, signOut } = useAuth()
  const roleSyncRef = useRef<string | null>(null)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    ensureSupabaseSession().then(() => {
      if (active) store.hydrateEtrack().catch(() => {})
    })
    return () => {
      active = false
    }
  }, [])

  const [dashboardSegment, routeRole] = location.pathname.split('/').slice(1, 3)
  const workspaceRole =
    dashboardSegment === 'dashboard' && isDashboardRole(routeRole) ? routeRole : user?.role

  useEffect(() => {
    if (loading) return
    const session = readSession()
    const ok = isAuthenticated || Boolean(session?.name && session?.username && isUserRole(session.role))
    if (!ok) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
      return
    }
    if (
      dashboardSegment === 'dashboard' &&
      isDashboardRole(routeRole) &&
      user &&
      routeRole !== user.role
    ) {
      const key = `${user.id}:${routeRole}`
      if (roleSyncRef.current !== key) {
        roleSyncRef.current = key
        continueAs(routeRole)
      }
    }
  }, [
    continueAs,
    dashboardSegment,
    isAuthenticated,
    loading,
    location.pathname,
    navigate,
    routeRole,
    user?.id,
    user?.role,
  ])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C0F14]">
        <p className="text-sm text-white/50">Opening workspace…</p>
      </div>
    )
  }

  const session = readSession()
  const resolvedUser =
    user ||
    (session?.name && session?.username && isUserRole(session.role)
      ? {
          id: session.id,
          full_name: session.name,
          username: session.username,
          email: session.email || '',
          role: session.role,
          avatar_url: '',
          bio: '',
          passport_slug: session.username,
          created_at: '',
        }
      : null)

  if (!resolvedUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C0F14]">
        <p className="text-sm text-white/50">Redirecting to sign in…</p>
      </div>
    )
  }

  const initial = resolvedUser.full_name?.[0] || resolvedUser.username?.[0] || '?'
  const roleForCopy = workspaceRole || resolvedUser.role

  const shortCopy: Record<string, string> = {
    organizer: 'Create with AI · approve people · Cardano check-in',
    participant: 'Apply · get ticket · check in on Cardano',
    volunteer: 'Roles · tasks · proof',
    sponsor: 'Discover events · submit interest',
  }

  const switchRole = (r: UserRole) => {
    setRoleMenuOpen(false)
    continueAs(r)
    navigate(getDashboardRoute(r))
  }

  return (
    <div className="dashboard-app min-h-screen bg-[#0C0F14] text-[#F2F0EA]">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0C0F14]/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-xl bg-white p-1.5 shadow-sm">
              <BrandLogo variant="icon" size={28} />
            </span>
            <Link
              to={getDashboardRoute(roleForCopy || 'organizer')}
              className="hidden text-sm font-semibold text-white/80 hover:text-white sm:inline"
            >
              Workspace
            </Link>
          </div>

          {/* Quiet role switcher — replaces loud purple pills */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold capitalize text-white/85 transition hover:border-white/20 hover:bg-white/[0.07]"
              aria-expanded={roleMenuOpen}
              aria-haspopup="listbox"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {roleForCopy}
              <ChevronDown className={`h-3.5 w-3.5 text-white/45 transition ${roleMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {roleMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close role menu"
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div
                  role="listbox"
                  className="absolute left-1/2 top-[calc(100%+0.4rem)] z-50 w-44 -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#161A22] py-1 shadow-2xl"
                >
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="option"
                      aria-selected={roleForCopy === r}
                      onClick={() => switchRole(r)}
                      className={`flex w-full items-center px-3.5 py-2.5 text-left text-xs font-semibold capitalize transition ${
                        roleForCopy === r
                          ? 'bg-white/[0.08] text-white'
                          : 'text-white/65 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <CloudStatusBadge compact />
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                {initial}
              </span>
              <span className="max-w-[8rem] truncate text-xs font-semibold text-white/80">
                {resolvedUser.full_name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate('/login'))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition hover:border-red-400/40 hover:text-red-300"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400/90">
            {roleForCopy} workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-white/50">
            {shortCopy[roleForCopy || 'organizer']}
          </p>
        </div>

        {children}
      </main>
    </div>
  )
}
