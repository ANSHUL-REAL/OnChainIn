import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, ExternalLink, Loader2, AlertCircle, Radio } from 'lucide-react'
import {
  feesLovelaceToAda,
  getTransactionStatus,
  isBlockfrostConfigured,
  waitForTransaction,
  type TxChainStatus,
} from '@/lib/blockfrost'
import { explorerTxUrl, truncateMiddle } from '@/lib/cardano'

type Props = {
  txHash?: string | null
  /** Poll until confirmed after a fresh submit */
  poll?: boolean
  className?: string
  compact?: boolean
}

export function ChainTxStatus({ txHash, poll = false, className = '', compact = false }: Props) {
  const [status, setStatus] = useState<TxChainStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!txHash?.trim()) {
      setStatus(null)
      return
    }
    let cancelled = false
    setLoading(true)

    const run = async () => {
      try {
        if (poll && isBlockfrostConfigured()) {
          const s = await waitForTransaction(txHash, {
            maxAttempts: 12,
            intervalMs: 2500,
            onTick: (tick) => {
              if (!cancelled) setStatus(tick)
            },
          })
          if (!cancelled) setStatus(s)
        } else {
          const s = await getTransactionStatus(txHash)
          if (!cancelled) setStatus(s)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [txHash, poll])

  if (!txHash?.trim()) return null

  const explorer = explorerTxUrl(txHash)

  if (!isBlockfrostConfigured()) {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 ${className}`}>
        <p className="font-bold">Blockfrost not configured</p>
        <p className="mt-0.5">Tx stored in app. Verify manually on explorer.</p>
        <a href={explorer} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-bold underline">
          {truncateMiddle(txHash, 10, 8)} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    )
  }

  const tone =
    status?.status === 'confirmed'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : status?.status === 'error' || status?.status === 'not_found'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-sky-200 bg-sky-50 text-sky-900'

  const Icon =
    loading || status?.status === 'pending'
      ? Loader2
      : status?.status === 'confirmed'
        ? CheckCircle2
        : status?.status === 'error'
          ? AlertCircle
          : Clock

  return (
    <div className={`rounded-xl border px-3 py-2 ${tone} ${className}`}>
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${loading || status?.status === 'pending' ? 'animate-spin' : ''}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] flex items-center gap-1">
            <Radio className="h-3 w-3" /> Blockfrost chain check
          </p>
          <p className={`mt-0.5 font-semibold ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {loading && !status
              ? 'Checking Preprod…'
              : status?.message || 'Checking…'}
          </p>
          {status?.status === 'confirmed' && (
            <p className="mt-1 text-[10px] opacity-80">
              Slot {status.slot} · fee ~{feesLovelaceToAda(status.fees)} ADA
            </p>
          )}
          <a
            href={explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold underline"
          >
            {truncateMiddle(txHash, 12, 10)} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
