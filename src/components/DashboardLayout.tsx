import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
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

export function DashboardLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading, isAuthenticated, continueAs, signOut } = useAuth()
  const roleSyncRef = useRef<string | null>(null)

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
      <div className="flex min-h-screen items-center justify-center bg-[#F6F2EB]">
        <p className="text-sm text-[#5E6256]">Opening workspace…</p>
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
      <div className="flex min-h-screen items-center justify-center bg-[#F6F2EB]">
        <p className="text-sm text-[#5E6256]">Redirecting to sign in…</p>
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

  return (
    /* eventos-light-app remaps legacy text-white utilities so lists stay readable on light cards */
    <div className="eventos-light-app min-h-screen bg-[#F6F2EB] text-[#192837]">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#F6F2EB]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <BrandLogo variant="icon" size={34} />

          <nav className="hidden items-center gap-1 md:flex">
            {(['organizer', 'participant', 'volunteer', 'sponsor'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  continueAs(r)
                  navigate(getDashboardRoute(r))
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  roleForCopy === r
                    ? 'bg-[#7C3AED] text-[#FFFFFF]'
                    : 'text-[#192837]/70 hover:bg-white'
                }`}
              >
                {r}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CloudStatusBadge compact />
            <div className="hidden items-center gap-2 rounded-full bg-white px-2.5 py-1.5 shadow-sm sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDE9FE] text-xs font-bold text-[#7C3AED]">
                {initial}
              </span>
              <span className="max-w-[8rem] truncate text-xs font-semibold">{resolvedUser.full_name}</span>
            </div>
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate('/login'))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#5E6256] shadow-sm hover:text-red-500"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7C3AED]">
            {roleForCopy} workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#192837] sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-[#5E6256]">
            {shortCopy[roleForCopy || 'organizer']}
          </p>
        </div>

        {children}
      </main>
    </div>
  )
}
