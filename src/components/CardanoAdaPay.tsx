import { useState } from 'react'
import { CardanoWallet, useWallet } from '@meshsdk/react'
import { Blocks, ExternalLink, Loader2, Wallet } from 'lucide-react'
import {
  CARDANO,
  explorerTxUrl,
  formatAda,
  submitAdaPayment,
  type AdaPaymentKind,
  type AdaPaymentPayload,
} from '@/lib/cardano'
import { ChainTxStatus } from '@/components/ChainTxStatus'

type Props = {
  label: string
  adaAmount: number
  toAddress: string
  payload: AdaPaymentPayload
  disabled?: boolean
  helperText?: string
  onPaid: (result: {
    txHash: string
    explorerUrl: string
    fromAddress: string
    toAddress: string
    adaAmount: number
  }) => void
}

/**
 * Connect wallet + send ADA with OnChainIn payment metadata.
 */
export function CardanoAdaPay({
  label,
  adaAmount,
  toAddress,
  payload,
  disabled,
  helperText,
  onPaid,
}: Props) {
  const { connected, wallet } = useWallet()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lastTx, setLastTx] = useState<string | null>(null)

  const pay = async () => {
    setError('')
    if (!connected || !wallet) {
      setError('Connect a Cardano Preprod wallet first (Lace).')
      return
    }
    if (!toAddress?.trim()) {
      setError('Recipient address missing. Organizer/winner must save a Cardano address.')
      return
    }
    if (!adaAmount || adaAmount < CARDANO.minPaymentAda) {
      setError(`Amount must be at least ${CARDANO.minPaymentAda} ADA.`)
      return
    }
    setBusy(true)
    try {
      const result = await submitAdaPayment(wallet, {
        toAddress,
        adaAmount,
        payload,
      })
      setLastTx(result.txHash)
      onPaid({
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        fromAddress: result.fromAddress,
        toAddress: result.toAddress,
        adaAmount: result.adaAmount,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#C4B5FD] bg-[#F5F3FF] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7C3AED]">
            Pay with Cardano
          </p>
          <p className="mt-0.5 text-sm font-bold text-[#192837]">
            {formatAda(adaAmount)} · {payload.kind.replace(/_/g, ' ')}
          </p>
          {helperText && <p className="mt-1 text-[11px] leading-4 text-[#5E6256]">{helperText}</p>}
        </div>
        <CardanoWallet label="Connect" persist isDark={false} />
      </div>
      <button
        type="button"
        disabled={disabled || busy || !adaAmount}
        onClick={() => void pay()}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Blocks className="h-3.5 w-3.5" />}
        {connected ? label : 'Connect wallet, then pay in ADA'}
      </button>
      {error && <p className="mt-2 text-[11px] font-semibold text-red-600">{error}</p>}
      {lastTx && (
        <div className="mt-2 space-y-2">
          <a
            href={explorerTxUrl(lastTx)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED]"
          >
            View tx on explorer <ExternalLink className="h-3 w-3" />
          </a>
          <ChainTxStatus txHash={lastTx} poll compact />
        </div>
      )}
      <p className="mt-2 flex items-start gap-1 text-[10px] text-[#5E6256]">
        <Wallet className="mt-0.5 h-3 w-3 shrink-0" />
        Network: {CARDANO.network}. Fund Preprod ADA via faucet if needed. Confirmation via Blockfrost.
      </p>
    </div>
  )
}

export type { AdaPaymentKind }
