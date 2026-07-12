import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Smartphone,
  Wallet,
  Droplets,
  Copy,
  Check,
  ExternalLink,
  Link2,
} from 'lucide-react'
import store from '@/data/store'
import { explorerAddressUrl, formatAda, truncateMiddle } from '@/lib/cardano'
import { getAddressBalance, isBlockfrostConfigured } from '@/lib/blockfrost'

const FAUCET_URL = 'https://docs.cardano.org/cardano-testnets/tools/faucet'

const MOBILE_WALLETS = [
  {
    name: 'Vespr',
    hint: 'Mobile wallet · open site inside browser',
    url: 'https://vespr.xyz',
  },
  {
    name: 'Eternl',
    hint: 'Mobile + desktop · Preprod network',
    url: 'https://eternl.io',
  },
  {
    name: 'Lace',
    hint: 'Best on desktop Chrome extension',
    url: 'https://www.lace.io',
  },
]

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

type Props = {
  /** When true, emphasize mobile path over extension */
  forceMobileStyle?: boolean
}

/**
 * Mobile-friendly wallet helper: no browser extension required.
 * - Save receive address
 * - QR for faucet (Preprod ADA)
 * - QR of this page to open in mobile wallet in-app browser
 * - Deep links to popular wallets
 */
export function MobileWalletPanel({ forceMobileStyle }: Props) {
  const user = store.getCurrentUser()
  const mobile = forceMobileStyle ?? isMobileDevice()
  const [address, setAddress] = useState(user?.cardano_address || '')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [pageUrl, setPageUrl] = useState('')
  const [balanceAda, setBalanceAda] = useState<number | null>(null)
  const [balanceMsg, setBalanceMsg] = useState('')

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  useEffect(() => {
    const addr = (address || user?.cardano_address || '').trim()
    if (!addr || addr.length < 20 || !isBlockfrostConfigured()) {
      setBalanceAda(null)
      setBalanceMsg(
        isBlockfrostConfigured() ? '' : 'Blockfrost not set — balance check unavailable',
      )
      return
    }
    let cancelled = false
    setBalanceMsg('Checking balance…')
    void getAddressBalance(addr).then((b) => {
      if (cancelled) return
      if (!b) {
        setBalanceAda(null)
        setBalanceMsg('Address not found on Preprod yet (fund via faucet).')
        return
      }
      setBalanceAda(b.ada)
      setBalanceMsg(
        b.ada >= 2
          ? 'Enough ADA for check-in (~1 ADA self-send + fee).'
          : 'Low balance — request Preprod ADA from the faucet.',
      )
    })
    return () => {
      cancelled = true
    }
  }, [address, user?.cardano_address])

  const siteOrigin = useMemo(() => {
    if (typeof window === 'undefined') return 'https://onchainin.vercel.app'
    return window.location.origin
  }, [])

  const saveAddress = () => {
    if (!user) return
    const trimmed = address.trim()
    if (trimmed.length < 20) return
    store.updateProfile(user.id, { cardano_address: trimmed })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-2xl border border-[#DCE8BE] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#7C3AED]">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7C3AED]">
            {mobile ? 'Phone wallet (no extension)' : 'Mobile / no-extension wallet'}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#5E6256]">
            Phone browsers can’t use Lace Chrome extensions. Save your Cardano{' '}
            <strong>Preprod receive address</strong>, fund it via faucet QR, then open this site in a
            mobile wallet browser — or show your ticket QR at the desk.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Address */}
        <div className="rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#192837]">
            <Wallet className="h-3.5 w-3.5 text-[#7C3AED]" /> Your wallet address
          </p>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="addr_test1… (Preprod)"
            className="w-full rounded-xl border border-[#DCE8BE] bg-white px-3 py-2 font-mono text-[11px] text-[#192837] placeholder:text-[#9AA08D] focus:border-[#7C3AED]/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={saveAddress}
            className="mt-2 w-full rounded-full bg-[#7C3AED] px-3 py-2 text-[11px] font-bold text-white"
          >
            {saved ? 'Saved ✓' : 'Save address'}
          </button>
          {user?.cardano_address && (
            <p className="mt-2 font-mono text-[10px] text-[#5E6256]">
              Saved: {truncateMiddle(user.cardano_address, 10, 8)}
            </p>
          )}
          {balanceAda !== null && (
            <p className="mt-2 text-xs font-bold text-[#7C3AED]">
              Balance: {formatAda(balanceAda)} (Blockfrost)
            </p>
          )}
          {balanceMsg && (
            <p className="mt-1 text-[10px] leading-4 text-[#5E6256]">{balanceMsg}</p>
          )}
        </div>

        {/* Faucet QR */}
        <div className="rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] p-3 text-center">
          <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold text-[#192837]">
            <Droplets className="h-3.5 w-3.5 text-sky-600" /> Fund Preprod ADA
          </p>
          <div className="mx-auto inline-flex rounded-lg bg-white p-2">
            <QRCodeSVG value={FAUCET_URL} size={108} bgColor="#ffffff" fgColor="#0f172a" />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#5E6256]">
            Scan to open the official Cardano Preprod faucet. Paste your address, request test ADA.
          </p>
          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED]"
          >
            Open faucet <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Open site on phone QR */}
        <div className="rounded-xl border border-[#E7E1D2] bg-[#F9F8F1] p-3 text-center">
          <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold text-[#192837]">
            <Link2 className="h-3.5 w-3.5 text-[#7C3AED]" /> Open OnChainIn on phone
          </p>
          <div className="mx-auto inline-flex rounded-lg bg-white p-2">
            <QRCodeSVG
              value={pageUrl || siteOrigin}
              size={108}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#5E6256]">
            Scan this QR, then open the link inside Vespr / Eternl in-app browser for wallet
            connect — not Safari/Chrome alone.
          </p>
          <button
            type="button"
            onClick={() => void copy(pageUrl || siteOrigin, 'page')}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED]"
          >
            {copied === 'page' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            Copy page link
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {MOBILE_WALLETS.map((w) => (
          <a
            key={w.name}
            href={w.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E1D2] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#192837] hover:border-[#7C3AED]/40"
            title={w.hint}
          >
            {w.name} <ExternalLink className="h-3 w-3 text-[#7C3AED]" />
          </a>
        ))}
        {address.trim().length > 20 && (
          <a
            href={explorerAddressUrl(address.trim())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800"
          >
            View address on explorer <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}

export { isMobileDevice }
