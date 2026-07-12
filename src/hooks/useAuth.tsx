import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Profile, UserRole } from '@/types'
import {
  clearSession,
  getDashboardRoute,
  isLoggedInSession,
  isUserRole,
  profileFromSession,
  readSession,
  type SessionUser,
  writeSession,
} from '@/lib/session'

export type DemoUser = SessionUser

type AuthContextValue = {
  user: Profile | null
  demoUser: SessionUser | null
  currentRole: UserRole | null
  loading: boolean
  isAuthenticated: boolean
  loginDemo: (input: {
    name: string
    username: string
    email?: string
    instagram_url?: string
    linkedin_url?: string
    github_url?: string
    role?: UserRole
  }) => Profile
  continueAs: (role: UserRole) => Profile | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export { getDashboardRoute, isUserRole }

function sessionsEqual(a: SessionUser | null, b: SessionUser | null) {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.username === b.username &&
    a.role === b.role &&
    a.email === b.email
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [demoUser, setDemoUser] = useState<SessionUser | null>(() => readSession())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setDemoUser(readSession())
    setLoading(false)

    const sync = () => {
      const next = readSession()
      setDemoUser((prev) => (sessionsEqual(prev, next) ? prev : next))
    }

    window.addEventListener('storage', sync)
    window.addEventListener('onchainin-session', sync as EventListener)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('onchainin-session', sync as EventListener)
    }
  }, [])

  const loginDemo = useCallback(
    (input: {
      name: string
      username: string
      email?: string
      instagram_url?: string
      linkedin_url?: string
      github_url?: string
      role?: UserRole
    }) => {
      const role: UserRole =
        (input.role && isUserRole(input.role) && input.role) ||
        readSession()?.role ||
        'participant'

      const session = writeSession(role, {
        name: input.name.trim(),
        username: input.username.trim(),
        email: input.email,
        instagram_url: input.instagram_url,
        linkedin_url: input.linkedin_url,
        github_url: input.github_url,
      })
      setDemoUser(session)
      return profileFromSession(session)
    },
    [],
  )

  const continueAs = useCallback((role: UserRole) => {
    const existing = readSession()
    if (!isLoggedInSession(existing)) {
      localStorage.setItem('onchainin_role_v2', role)
      return null
    }
    if (existing.role === role) {
      return profileFromSession(existing)
    }
    const session = writeSession(role, {
      name: existing.name,
      username: existing.username,
      email: existing.email,
      instagram_url: existing.instagram_url,
      linkedin_url: existing.linkedin_url,
      github_url: existing.github_url,
      id: existing.id,
    })
    setDemoUser(session)
    return profileFromSession(session)
  }, [])

  const signOut = useCallback(async () => {
    clearSession()
    setDemoUser(null)
  }, [])

  const isAuthenticated = isLoggedInSession(demoUser)

  // Stable user reference — prevents DashboardLayout effect loops / flicker
  const user = useMemo(() => {
    if (!isLoggedInSession(demoUser)) return null
    return profileFromSession(demoUser)
  }, [demoUser])

  const currentRole = user?.role ?? null

  const value = useMemo(
    () => ({
      user,
      demoUser: isAuthenticated ? demoUser : null,
      currentRole,
      loading,
      isAuthenticated,
      loginDemo,
      continueAs,
      signOut,
    }),
    [user, demoUser, currentRole, loading, isAuthenticated, loginDemo, continueAs, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider.')
  return ctx
}

export const demoUsers = {
  organizer: { id: 'demo-organizer', name: 'Organizer', username: 'organizer', role: 'organizer' as const },
  participant: { id: 'demo-participant', name: 'Participant', username: 'participant', role: 'participant' as const },
  volunteer: { id: 'demo-volunteer', name: 'Volunteer', username: 'volunteer', role: 'volunteer' as const },
  sponsor: { id: 'demo-sponsor', name: 'Sponsor', username: 'sponsor', role: 'sponsor' as const },
}

export function profileFromDemoUser(demoUser: SessionUser): Profile {
  return profileFromSession(demoUser)
}
