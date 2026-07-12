/**
 * Single source of truth for login session.
 * useAuth + store.getCurrentUser() BOTH read/write these keys.
 */
import type { Profile, UserRole } from '@/types'

export const SESSION_ROLE_KEY = 'onchainin_role_v2'
export const SESSION_USER_KEY = 'onchainin_session_v2'
export const PROFILES_KEY = 'OnChainIn_profiles_v2'

// Legacy keys (clear on write so old bugs don't linger)
const LEGACY_KEYS = ['currentRole', 'currentUser', 'OnChainIn_current_user', 'eventos_current_user']

export type SessionUser = {
  id: string
  name: string
  username: string
  email?: string
  instagram_url?: string
  linkedin_url?: string
  github_url?: string
  role: UserRole
}

export function isUserRole(role: string | null | undefined): role is UserRole {
  return role === 'organizer' || role === 'participant' || role === 'volunteer' || role === 'sponsor'
}

export function normalizeUsername(value?: string) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 28)
}

export function nameToUsername(name?: string) {
  return normalizeUsername(name?.replace(/\s+/g, '') || 'user')
}

export function sessionIdFromUsername(username: string) {
  return `user-${username || 'user'}`
}

export function isLoggedInSession(user: SessionUser | null | undefined): user is SessionUser {
  return Boolean(
    user &&
      user.id &&
      user.id !== 'pending' &&
      user.name?.trim() &&
      user.username?.trim() &&
      isUserRole(user.role),
  )
}

export function profileFromSession(user: SessionUser): Profile {
  return {
    id: user.id,
    full_name: user.name,
    username: user.username,
    email: user.email || '',
    role: user.role,
    avatar_url: '',
    bio: '',
    instagram_url: user.instagram_url || '',
    linkedin_url: user.linkedin_url || '',
    github_url: user.github_url || '',
    passport_slug: user.username,
    created_at: user.id ? new Date().toISOString() : '',
  }
}

export function readSession(): SessionUser | null {
  try {
    if (typeof window === 'undefined') return null
    const storedUser = localStorage.getItem(SESSION_USER_KEY)
    const storedRole = localStorage.getItem(SESSION_ROLE_KEY)
    if (!storedUser) return null

    const parsed = JSON.parse(storedUser) as Partial<SessionUser>
    const role = isUserRole(parsed.role)
      ? parsed.role
      : isUserRole(storedRole)
        ? storedRole
        : null

    if (!parsed.username || !parsed.name || !role) return null

    const id = parsed.id && parsed.id !== 'pending' ? parsed.id : sessionIdFromUsername(parsed.username)

    return {
      id,
      name: String(parsed.name).trim(),
      username: normalizeUsername(parsed.username),
      email: parsed.email || '',
      instagram_url: parsed.instagram_url || '',
      linkedin_url: parsed.linkedin_url || '',
      github_url: parsed.github_url || '',
      role,
    }
  } catch {
    return null
  }
}

function upsertProfile(profile: Profile) {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]') as Profile[]
    const index = profiles.findIndex((p) => p.id === profile.id || p.username === profile.username)
    if (index === -1) profiles.push(profile)
    else profiles[index] = { ...profiles[index], ...profile, role: profile.role }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
    // Notify cloud sync if available
    void import('@/lib/cloudSync').then((m) => m.notifyLocalWrite(PROFILES_KEY)).catch(() => {})
  } catch {
    localStorage.setItem(PROFILES_KEY, JSON.stringify([profile]))
  }
}

export function writeSession(
  role: UserRole,
  input?: {
    name?: string
    username?: string
    email?: string
    instagram_url?: string
    linkedin_url?: string
    github_url?: string
    id?: string
  },
): SessionUser {
  const existing = readSession()
  const username =
    normalizeUsername(input?.username) ||
    existing?.username ||
    nameToUsername(input?.name) ||
    'user'
  const name = (input?.name || existing?.name || username).trim()
  const id =
    input?.id ||
    (existing?.username === username ? existing.id : undefined) ||
    sessionIdFromUsername(username)

  const session: SessionUser = {
    id,
    name,
    username,
    email: (input?.email ?? existing?.email ?? '').trim(),
    instagram_url: (input?.instagram_url ?? existing?.instagram_url ?? '').trim(),
    linkedin_url: (input?.linkedin_url ?? existing?.linkedin_url ?? '').trim(),
    github_url: (input?.github_url ?? existing?.github_url ?? '').trim(),
    role,
  }

  localStorage.setItem(SESSION_ROLE_KEY, role)
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(session))

  // Clear legacy keys that used to break getCurrentUser()
  for (const k of LEGACY_KEYS) {
    localStorage.removeItem(k)
  }

  upsertProfile(profileFromSession(session))

  // Same-tab listeners (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent('onchainin-session', { detail: session }))

  return session
}

export function clearSession() {
  localStorage.removeItem(SESSION_ROLE_KEY)
  localStorage.removeItem(SESSION_USER_KEY)
  for (const k of LEGACY_KEYS) {
    localStorage.removeItem(k)
  }
  window.dispatchEvent(new CustomEvent('onchainin-session', { detail: null }))
}

export function getDashboardRoute(role?: UserRole | null) {
  if (!role) return '/login'
  return {
    organizer: '/dashboard/organizer',
    participant: '/dashboard/participant',
    volunteer: '/dashboard/volunteer',
    sponsor: '/dashboard/sponsor',
  }[role]
}
