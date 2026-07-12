import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRight, Shield, UserPlus } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { getDashboardRoute, useAuth } from '@/hooks/useAuth'
import { isUserRole, normalizeUsername, readSession } from '@/lib/session'
import type { UserRole } from '@/types'

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginDemo, isAuthenticated, user } = useAuth()
  const roleFromUrl = searchParams.get('role')

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>(
    isUserRole(roleFromUrl) ? roleFromUrl : 'participant',
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const preview = useMemo(
    () => normalizeUsername(username || name.replace(/\s+/g, '')),
    [name, username],
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const fullName = name.trim()
    const finalUsername = normalizeUsername(username || name.replace(/\s+/g, ''))

    if (!fullName) {
      setError('Enter your full name.')
      return
    }
    if (!finalUsername) {
      setError('Pick a username (letters and numbers).')
      return
    }

    // Optional: block taking an existing username with different intent
    const existing = readSession()
    if (existing?.username === finalUsername && existing.name !== fullName) {
      // same device re-signup overwrites — OK for demo
    }

    setSubmitting(true)
    try {
      const profile = loginDemo({
        name: fullName,
        username: finalUsername,
        email,
        role,
      })
      navigate(getDashboardRoute(profile.role || role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="eventos-light-app min-h-screen bg-[radial-gradient(circle_at_82%_5%,rgba(220,233,183,0.96),transparent_30rem),linear-gradient(180deg,#F9F8F1_0%,#F6FAE8_50%,#F9F8F1_100%)] text-[#14150F]">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <div className="rounded-[2rem] border border-[#DCE8BE] bg-white/95 p-6 shadow-xl sm:p-8">
          <div className="mb-8">
            <BrandLogo variant="icon" size={48} />
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#DCE8BE] bg-[#F6FAE8] px-3 py-1.5 text-[#52670F]">
            <UserPlus className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-[0.16em]">Sign up</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-[#5E6256]">
            Choose a role, pick a name and username. Then open your dashboard.
          </p>

          {isAuthenticated && user && (
            <p className="mt-4 rounded-xl border border-[#DCE8BE] bg-[#F6FAE8] px-3 py-2 text-xs font-semibold text-[#52670F]">
              Already signed in as {user.full_name}.{' '}
              <Link to={getDashboardRoute(user.role)} className="underline">
                Go to dashboard
              </Link>{' '}
              or create another account below.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#5E6256]">
                I am a
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-sm font-semibold"
              >
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
                <option value="volunteer">Volunteer</option>
                <option value="sponsor">Sponsor</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#5E6256]">
                Full name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-sm font-semibold"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#5E6256]">
                Username
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                placeholder="yourname"
                className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-sm font-semibold"
                autoComplete="username"
              />
              <p className="mt-1 text-xs text-[#5E6256]">@{preview || 'username'}</p>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.14em] text-[#5E6256]">
                Email (optional)
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-sm font-semibold"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="gold-btn w-full justify-center py-3 disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#5E6256]">
            Already have an account?{' '}
            <Link to="/login" className="font-black text-[#52670F] underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
