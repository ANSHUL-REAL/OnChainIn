import { useEffect, useState } from 'react'
import { Cloud, CloudOff, Copy, Check, Loader2, RefreshCw, ExternalLink, X } from 'lucide-react'
import {
  getCloudStatus,
  onCloudStatus,
  pullFromCloud,
  startCloudSync,
  OCI_STORE_MIGRATION_SQL,
  type CloudStatus,
} from '@/lib/cloudSync'

export function CloudStatusBadge({ compact = false }: { compact?: boolean }) {
  const [{ status, lastError, enabled }, setState] = useState(getCloudStatus())
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(OCI_STORE_MIGRATION_SQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
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
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (status === 'error') setOpen((o) => !o)
          else void refresh()
        }}
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

      {open && status === 'error' && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/20"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-[min(92vw,22rem)] rounded-2xl border border-red-200 bg-white p-4 text-left shadow-xl">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-red-700">Cloud not ready</p>
              <button type="button" onClick={() => setOpen(false)} className="text-[#5E6256]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs leading-5 text-[#5E6256]">{lastError || 'Unknown error'}</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs text-[#192837]">
              <li>
                Open Supabase → <strong>SQL Editor</strong>
              </li>
              <li>
                Paste the migration SQL (button below) and click <strong>Run</strong>
              </li>
              <li>Come back here and click Retry</li>
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copySql()}
                className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED] px-3 py-1.5 text-[11px] font-bold text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy SQL'}
              </button>
              <a
                href="https://supabase.com/dashboard/project/gxzemlxhxvrugrbvnhlz/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-[#E7E1D2] bg-[#F6F2EB] px-3 py-1.5 text-[11px] font-bold text-[#192837]"
              >
                Open SQL Editor <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </div>
          </div>
        </>
      )}
    </div>
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
