import { useEffect, useState } from 'react'
import { Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react'
import {
  getCloudStatus,
  onCloudStatus,
  pullFromCloud,
  startCloudSync,
  type CloudStatus,
} from '@/lib/cloudSync'

export function CloudStatusBadge({ compact = false }: { compact?: boolean }) {
  const [{ status, lastError, enabled }, setState] = useState(getCloudStatus())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void startCloudSync()
    const unsub = onCloudStatus((s, detail) => {
      setState({ status: s, lastError: detail || '', enabled: getCloudStatus().enabled })
    })
    return () => {
      unsub()
    }
  }, [])

  const refresh = async () => {
    setBusy(true)
    await pullFromCloud()
    setBusy(false)
  }

  if (!enabled) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800"
        title="Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY for multi-user online mode"
      >
        <CloudOff className="h-3.5 w-3.5" />
        {compact ? 'Local only' : 'Local only · set Supabase for multi-user'}
      </div>
    )
  }

  const label =
    status === 'online'
      ? 'Online · multi-user'
      : status === 'connecting'
        ? 'Connecting…'
        : status === 'error'
          ? 'Cloud error'
          : 'Offline'

  const tone =
    status === 'online'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-sky-200 bg-sky-50 text-sky-800'

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone}`}
      title={lastError || 'Click to sync now'}
    >
      {busy || status === 'connecting' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === 'online' ? (
        <Cloud className="h-3.5 w-3.5" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  )
}

/** Invisible bootstrap — call once in app shell */
export function CloudBootstrap() {
  useEffect(() => {
    void startCloudSync()

    const onStorage = () => {
      /* store re-reads from localStorage on next get* call */
    }
    window.addEventListener('onchainin-storage', onStorage)
    return () => window.removeEventListener('onchainin-storage', onStorage)
  }, [])
  return null
}

export type { CloudStatus }
