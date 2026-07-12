import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  ArrowRight,
  CheckCircle2,
  Github,
  Instagram,
  Linkedin,
  LockKeyhole,
  UserRound,
} from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { getDashboardRoute, useAuth } from '@/hooks/useAuth'
import { isUserRole, normalizeUsername, readSession } from '@/lib/session'
import type { UserRole } from '@/types'

const productPoints = [
  'Enter your real name — that is your account for this device/cloud',
  'Pick a role (organizer, participant, volunteer, sponsor)',
  'You stay logged in until you sign out',
  'Cardano wallet is separate — connect Lace, Eternl, Nami, or any CIP-30 wallet when checking in',
]

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, loginDemo, loading } = useAuth()
  const roleFromUrl = searchParams.get('role')

  const existing = readSession()
  const [name, setName] = useState(existing?.name || user?.full_name || '')
  const [username, setUsername] = useState(existing?.username || user?.username || '')
  const [email, setEmail] = useState(existing?.email || user?.email || '')
  const [instagramUrl, setInstagramUrl] = useState(existing?.instagram_url || '')
  const [linkedinUrl, setLinkedinUrl] = useState(existing?.linkedin_url || '')
  const [githubUrl, setGithubUrl] = useState(existing?.github_url || '')
  const [role, setRole] = useState<UserRole>(
    isUserRole(roleFromUrl)
      ? roleFromUrl
      : isUserRole(existing?.role)
        ? existing!.role
        : 'participant',
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isUserRole(roleFromUrl)) setRole(roleFromUrl)
  }, [roleFromUrl])

  // If already logged in, offer continue (don't force redirect loop)
  useEffect(() => {
    if (loading) return
    if (isAuthenticated && user && searchParams.get('force') !== '1') {
      // stay on page so user can switch account; they can click continue
    }
  }, [isAuthenticated, loading, searchParams, user])

  const previewUsername = useMemo(
    () => normalizeUsername(username || name.replace(/\s+/g, '')),
    [name, username],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const fullName = name.trim()
    const finalUsername = normalizeUsername(username || name.replace(/\s+/g, ''))

    if (!fullName) {
      setError('Enter your full name.')
      setSubmitting(false)
      return
    }
    if (!finalUsername) {
      setError('Enter a username (letters and numbers).')
      setSubmitting(false)
      return
    }

    try {
      const profile = loginDemo({
        name: fullName,
        username: finalUsername,
        email,
        instagram_url: instagramUrl,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        role,
      })

      // Hard navigate after session is written to localStorage
      const dest = getDashboardRoute(profile.role || role)
      window.setTimeout(() => {
        navigate(dest, { replace: true })
        setSubmitting(false)
      }, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setSubmitting(false)
    }
  }

  const continueExisting = () => {
    const session = readSession()
    if (!session?.name || !session?.username) {
      setError('No saved session. Fill the form and log in.')
      return
    }
    navigate(getDashboardRoute(session.role || role), { replace: true })
  }

  return (
    <div className="eventos-light-app min-h-screen overflow-hidden bg-[radial-gradient(circle_at_82%_5%,rgba(220,233,183,0.96),transparent_30rem),radial-gradient(circle_at_0%_34%,rgba(244,196,103,0.34),transparent_25rem),linear-gradient(180deg,#F9F8F1_0%,#F6FAE8_50%,#F9F8F1_100%)] text-[#14150F]">
      <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.96fr_1.04fr]">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-[#DCE8BE] bg-white/90 p-6 shadow-[0_32px_90px_rgba(82,103,15,0.14)] backdrop-blur-xl sm:p-10">
          <div className="absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-[#DCE8BE] blur-3xl" />
          <div className="relative">
            <div className="mb-10">
              <BrandLogo variant="icon" size={56} />
            </div>

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#DCE8BE] bg-[#F6FAE8] px-4 py-2 text-[#52670F] shadow-sm">
              <UserRound className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-[0.18em]">Sign in</span>
            </div>

            <h1 className="max-w-xl text-5xl font-black leading-[0.94] tracking-[-0.04em] sm:text-6xl">
              Sign in to your workspace.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5E6256]">
              Use the same name and username you signed up with. Choose your role and open the dashboard.
              New here?{' '}
              <Link to="/signup" className="font-black text-[#52670F] underline">
                Create an account
              </Link>
              .
            </p>

            {isAuthenticated && user && (
              <button
                type="button"
                onClick={continueExisting}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#DCE8BE] bg-[#EEF5D9] px-6 py-3 text-sm font-black text-[#52670F] transition-all hover:bg-[#EEF5D9] sm:w-auto"
              >
                Continue as {user.full_name} ({user.role})
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[#5E6256]">
                  I am a
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-base font-semibold text-[#14150F] focus:border-[#52670F]/50 focus:outline-none"
                >
                  <option value="participant">Participant</option>
                  <option value="organizer">Organizer</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="sponsor">Sponsor</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[#5E6256]">
                  Full name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-base font-semibold text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[#5E6256]">
                  Username
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                  placeholder="yourname"
                  autoComplete="username"
                  className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-base font-semibold text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
                />
                <p className="mt-2 text-xs font-semibold text-[#5E6256]">
                  Preview: @{previewUsername || 'username'}
                </p>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[#5E6256]">
                  Email (optional)
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-4 py-3 text-base font-semibold text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#5E6256]">
                    <Instagram className="h-3.5 w-3.5" /> Insta
                  </span>
                  <input
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="optional"
                    className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-3 py-3 text-sm font-semibold text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#5E6256]">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </span>
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="optional"
                    className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-3 py-3 text-sm font-semibold text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#5E6256]">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </span>
                  <input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="optional"
                    className="w-full rounded-2xl border border-[#DCE8BE] bg-[#F7F6EB] px-3 py-3 text-sm font-semibold text-[#14150F] placeholder:text-[#9AA08D] focus:border-[#52670F]/50 focus:outline-none"
                  />
                </label>
              </div>

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="gold-btn w-full justify-center py-3.5 text-base disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-sm text-[#5E6256]">
                No account yet?{' '}
                <Link to="/signup" className="font-black text-[#52670F] underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </section>

        <section className="hidden lg:flex flex-col justify-center gap-6 px-4">
          <div className="rounded-[2rem] border border-[#DCE8BE] bg-white/80 p-8 shadow-lg">
            <div className="flex items-center gap-2 text-[#52670F]">
              <LockKeyhole className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-[0.18em]">How login works</span>
            </div>
            <ul className="mt-6 space-y-4">
              {productPoints.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-[#5E6256]">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#52670F]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
