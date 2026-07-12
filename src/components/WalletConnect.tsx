import { CardanoWallet, useWallet, useWalletList } from '@meshsdk/react'
import { Wallet } from 'lucide-react'

/** Common CIP-30 browser wallets OnChainIn works with (any installed CIP-30 wallet). */
export const SUPPORTED_WALLETS = [
  'Lace',
  'Eternl',
  'Nami',
  'Flint',
  'Typhon',
  'Gero',
  'NuFi',
  'Vespr',
  'Yoroi',
  'Begin',
] as const

type Props = {
  label?: string
  /** Show list of detected + supported wallets under the button */
  showHints?: boolean
  className?: string
  isDark?: boolean
}

/**
 * Multi-wallet connect (Mesh CIP-30).
 * Opens Mesh picker for every installed browser extension, not Lace-only.
 */
export function WalletConnect({
  label = 'Connect wallet',
  showHints = true,
  className = '',
  isDark = false,
}: Props) {
  const { connected, name, disconnect } = useWallet()
  const installed = useWalletList()

  const installedNames = (installed || [])
    .map((w) => w.name || (w as { id?: string }).id || '')
    .filter(Boolean)

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <CardanoWallet label={label} persist isDark={isDark} showDownload />
        {connected && name && (
          <button
            type="button"
            onClick={() => disconnect()}
            className="rounded-full border border-[#E7E1D2] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5E6256] hover:border-red-200 hover:text-red-600"
            title="Disconnect wallet"
          >
            Disconnect {name}
          </button>
        )}
      </div>

      {showHints && (
        <div className="mt-2 space-y-1">
          {connected && name ? (
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <Wallet className="h-3 w-3" /> Connected: {name} · any CIP-30 wallet works
            </p>
          ) : (
            <>
              <p className="text-[11px] leading-4 text-[#5E6256]">
                Works with <strong>any Cardano browser wallet</strong> (CIP-30): Lace, Eternl, Nami,
                Flint, Typhon, Gero, NuFi, Vespr, Yoroi, and others you have installed.
              </p>
              {installedNames.length > 0 ? (
                <p className="text-[10px] font-semibold text-[#7C3AED]">
                  Detected on this browser: {installedNames.join(', ')}
                </p>
              ) : (
                <p className="text-[10px] text-amber-800">
                  No wallet extension detected yet. Install Lace / Eternl / Nami (Preprod network), then
                  refresh and click Connect.
                </p>
              )}
            </>
          )}
          <p className="text-[10px] text-[#9AA08D]">
            Switch wallet to <strong>Preprod</strong> testnet for demos. Mobile: open this site inside
            Vespr / Eternl in-app browser.
          </p>
        </div>
      )}
    </div>
  )
}
