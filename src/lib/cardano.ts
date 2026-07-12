/**
 * Cardano (Mesh.js) helpers for OnChainIn.
 * - Attendance proof (self-send + metadata)
 * - ADA payments: fees, sponsorship, prizes, volunteer payouts
 */
import { BrowserWallet, Transaction } from '@meshsdk/core'
import type { IWallet } from '@meshsdk/common'

export const CARDANO = {
  network: (import.meta.env.VITE_CARDANO_NETWORK as string) || 'preprod',
  metadataLabel: 674,
  appId: 'OnChainIn',
  checkInLovelace: '1000000',
  /** Minimum payment (1 ADA) — wallet dust rules */
  minPaymentAda: 1,
  explorerBase:
    (import.meta.env.VITE_CARDANO_NETWORK as string) === 'mainnet'
      ? 'https://cardanoscan.io'
      : 'https://preprod.cardanoscan.io',
  faucetUrl: 'https://docs.cardano.org/cardano-testnets/tools/faucet',
} as const

export function explorerTxUrl(txHash: string) {
  return `${CARDANO.explorerBase}/transaction/${txHash}`
}

export function explorerAddressUrl(address: string) {
  return `${CARDANO.explorerBase}/address/${address}`
}

export function truncateMiddle(value: string, start = 8, end = 6) {
  if (!value || value.length <= start + end + 1) return value || '—'
  return `${value.slice(0, start)}…${value.slice(-end)}`
}

export function adaToLovelace(ada: number): string {
  if (!Number.isFinite(ada) || ada <= 0) throw new Error('ADA amount must be greater than 0')
  // Use integer lovelace (1 ADA = 1_000_000 lovelace)
  const lovelace = Math.round(ada * 1_000_000)
  if (lovelace < 1_000_000) {
    throw new Error(`Minimum payment is ${CARDANO.minPaymentAda} ADA on Cardano`)
  }
  return String(lovelace)
}

export function lovelaceToAda(lovelace: string | number): number {
  const n = typeof lovelace === 'string' ? Number(lovelace) : lovelace
  return n / 1_000_000
}

export function formatAda(ada: number, digits = 2): string {
  if (!Number.isFinite(ada)) return '0 ₳'
  return `${ada.toLocaleString(undefined, { maximumFractionDigits: digits })} ₳`
}

export type OnChainProofKind =
  | 'attendance'
  | 'registration'
  | 'volunteer'
  | 'certificate'

export type AdaPaymentKind =
  | 'participation_fee'
  | 'sponsorship'
  | 'prize'
  | 'volunteer_payout'

export interface OnChainProofPayload {
  kind: OnChainProofKind
  eventId: string
  eventTitle: string
  registrationCode?: string
  role?: string
  participantId?: string
  session?: string
  location?: string
}

export interface AdaPaymentPayload {
  kind: AdaPaymentKind
  eventId: string
  eventTitle: string
  /** Human-readable label e.g. "1st Prize", "Title Sponsor" */
  label?: string
  /** Recipient user id in OnChainIn (winner / volunteer / organizer) */
  toUserId?: string
  /** Payer role */
  fromRole?: string
  /** Extra note (truncated / package) */
  note?: string
}

/**
 * Cardano tx metadata strings are hard-capped at 64 bytes (UTF-8).
 * Longer titles / pipe-joined msgs fail with MAX_LENGTH_LIMIT.
 */
export const META_STR_MAX = 64

/** Truncate a string to at most maxBytes UTF-8 bytes (safe for Cardano metadatum). */
export function clipMetaString(value: string | undefined | null, maxBytes = META_STR_MAX): string {
  const s = String(value ?? '')
  if (!s) return ''
  const encoder = new TextEncoder()
  if (encoder.encode(s).length <= maxBytes) return s
  // Binary-search a code-unit cut that stays within maxBytes
  let lo = 0
  let hi = s.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (encoder.encode(s.slice(0, mid)).length <= maxBytes) lo = mid
    else hi = mid - 1
  }
  return s.slice(0, lo)
}

/** Split into CIP-20 style `msg` array entries, each ≤ 64 bytes. */
export function metaMsgChunks(...parts: Array<string | number | undefined | null>): string[] {
  const joined = parts
    .map((p) => (p == null || p === '' ? '' : String(p)))
    .filter(Boolean)
    .join('|')
  if (!joined) return [clipMetaString(CARDANO.appId)]
  const encoder = new TextEncoder()
  if (encoder.encode(joined).length <= META_STR_MAX) return [joined]
  const chunks: string[] = []
  let rest = joined
  while (rest.length > 0) {
    const piece = clipMetaString(rest, META_STR_MAX)
    if (!piece) break
    chunks.push(piece)
    rest = rest.slice(piece.length)
  }
  return chunks.length ? chunks : [clipMetaString(CARDANO.appId)]
}

export function buildMetadata(payload: OnChainProofPayload) {
  const timestamp = Math.floor(Date.now() / 1000)
  const code = payload.registrationCode || ''
  // Prefer short ids in msg; full title lives (clipped) on `event` only.
  return {
    app: clipMetaString(CARDANO.appId),
    kind: clipMetaString(payload.kind),
    event_id: clipMetaString(payload.eventId),
    event: clipMetaString(payload.eventTitle),
    registration_code: clipMetaString(code),
    role: clipMetaString(payload.role || 'participant'),
    participant_id: clipMetaString(payload.participantId || ''),
    session: clipMetaString(payload.session || 'Main'),
    location: clipMetaString(payload.location || ''),
    timestamp,
    msg: metaMsgChunks(
      CARDANO.appId,
      payload.kind,
      payload.eventId,
      code,
      timestamp,
    ),
  }
}

export function buildPaymentMetadata(payload: AdaPaymentPayload, adaAmount: number) {
  const timestamp = Math.floor(Date.now() / 1000)
  return {
    app: clipMetaString(CARDANO.appId),
    kind: clipMetaString(payload.kind),
    event_id: clipMetaString(payload.eventId),
    event: clipMetaString(payload.eventTitle),
    label: clipMetaString(payload.label || payload.kind),
    to_user_id: clipMetaString(payload.toUserId || ''),
    from_role: clipMetaString(payload.fromRole || ''),
    note: clipMetaString(payload.note || ''),
    ada: adaAmount,
    timestamp,
    msg: metaMsgChunks(
      CARDANO.appId,
      payload.kind,
      payload.eventId,
      `${adaAmount}ADA`,
      timestamp,
    ),
  }
}

/** Lace / CIP-30 often kills the injected API after idle, tab sleep, or extension reload. */
export function isStaleWalletError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    msg.includes('shutdown') ||
    msg.includes('no longer be used') ||
    msg.includes('cardano-wallet-api') ||
    msg.includes('account changed') ||
    msg.includes('not enabled') ||
    msg.includes('connection lost') ||
    msg.includes('disconnected') ||
    msg.includes('wallet not available') ||
    msg.includes('no account set')
  )
}

const STALE_WALLET_HELP =
  'Wallet connection expired (extension closed the CIP-30 channel). Click Disconnect, connect again, then check in immediately and approve the wallet popup — do not switch tabs while signing.'

/** Re-open CIP-30 via Mesh (fresh API object). */
export async function reenableWallet(walletName?: string | null): Promise<IWallet | null> {
  const raw = (walletName || '').trim()
  if (!raw) return null
  const candidates = Array.from(
    new Set([raw, raw.toLowerCase(), raw.replace(/\s+/g, ''), raw.toLowerCase().replace(/\s+/g, '')]),
  )
  for (const id of candidates) {
    try {
      const w = await BrowserWallet.enable(id)
      if (w) return w
    } catch {
      /* try next id form */
    }
  }
  return null
}

/** Ping wallet; if dead, re-enable by name. */
export async function ensureLiveWallet(
  wallet: IWallet,
  walletName?: string | null,
): Promise<IWallet> {
  if (!wallet) throw new Error('Wallet not connected')
  try {
    const addr = await wallet.getChangeAddress()
    if (addr) return wallet
  } catch (err) {
    if (!isStaleWalletError(err) && !walletName) throw mapSignError(err)
  }
  const revived = await reenableWallet(walletName)
  if (revived) {
    try {
      await revived.getChangeAddress()
      return revived
    } catch {
      /* fall through */
    }
  }
  throw new Error(STALE_WALLET_HELP)
}

function mapBuildError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (isStaleWalletError(err)) {
    return new Error(STALE_WALLET_HELP)
  }
  if (lower.includes('utxo') || lower.includes('insufficient')) {
    return new Error(
      'Insufficient Preprod ADA. Fund your wallet from the Cardano faucet, then try again.',
    )
  }
  if (lower.includes('max_length') || lower.includes('too long') || lower.includes('64')) {
    return new Error(
      'Transaction metadata was too long for Cardano (64-byte limit per string). Refresh and try check-in again.',
    )
  }
  return new Error(`Failed to build transaction: ${msg}`)
}

function mapSignError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (isStaleWalletError(err)) {
    return new Error(STALE_WALLET_HELP)
  }
  if (
    lower.includes('declin') ||
    lower.includes('reject') ||
    lower.includes('user declined') ||
    lower.includes('user rejected') ||
    lower.includes('canceled') ||
    lower.includes('cancelled')
  ) {
    return new Error('Transaction was rejected in your wallet.')
  }
  return new Error(`Signing failed: ${msg}`)
}

function mapSubmitError(err: unknown): Error {
  if (isStaleWalletError(err)) return new Error(STALE_WALLET_HELP)
  const msg = err instanceof Error ? err.message : String(err)
  return new Error(`Submission failed: ${msg}`)
}

export type WalletTxOpts = {
  /** Mesh / extension name (Lace, eternl, …) so we can re-enable a dead channel */
  walletName?: string | null
}

/**
 * Self-transfer with attendance/proof metadata. User signs in wallet.
 */
export async function submitOnChainProof(
  wallet: IWallet,
  payload: OnChainProofPayload,
  opts?: WalletTxOpts,
): Promise<{ txHash: string; walletAddress: string; metadata: ReturnType<typeof buildMetadata> }> {
  if (!wallet) throw new Error('Wallet not connected')

  let active = await ensureLiveWallet(wallet, opts?.walletName)
  const metadata = buildMetadata(payload)

  const buildAndSign = async (w: IWallet) => {
    const address = await w.getChangeAddress()
    if (!address) throw new Error('Could not read wallet address')
    const tx = new Transaction({ initiator: w })
      .sendLovelace(address, CARDANO.checkInLovelace)
      .setMetadata(CARDANO.metadataLabel, metadata)
    let unsignedTx: string
    try {
      unsignedTx = await tx.build()
    } catch (err) {
      throw mapBuildError(err)
    }
    let signedTx: string
    try {
      signedTx = await w.signTx(unsignedTx)
    } catch (err) {
      throw err
    }
    let txHash: string
    try {
      txHash = await w.submitTx(signedTx)
    } catch (err) {
      throw mapSubmitError(err)
    }
    return { txHash, walletAddress: address, metadata }
  }

  try {
    return await buildAndSign(active)
  } catch (err) {
    if (!isStaleWalletError(err)) {
      if (err instanceof Error && (err.message.startsWith('Failed to build') || err.message.startsWith('Submission') || err.message === STALE_WALLET_HELP || err.message.startsWith('Transaction was rejected') || err.message.startsWith('Signing failed') || err.message.startsWith('Could not'))) {
        throw err
      }
      throw mapSignError(err)
    }
    // One automatic reconnect + retry (Lace channel shutdown)
    const revived = await reenableWallet(opts?.walletName)
    if (!revived) throw new Error(STALE_WALLET_HELP)
    active = revived
    try {
      return await buildAndSign(active)
    } catch (err2) {
      if (err2 instanceof Error && err2.message === STALE_WALLET_HELP) throw err2
      throw mapSignError(err2)
    }
  }
}

/**
 * Send ADA to a recipient address with payment metadata (fee / sponsor / prize / volunteer).
 */
export async function submitAdaPayment(
  wallet: IWallet,
  opts: {
    toAddress: string
    adaAmount: number
    payload: AdaPaymentPayload
    walletName?: string | null
  },
): Promise<{
  txHash: string
  fromAddress: string
  toAddress: string
  adaAmount: number
  lovelace: string
  metadata: ReturnType<typeof buildPaymentMetadata>
  explorerUrl: string
}> {
  if (!wallet) throw new Error('Wallet not connected')
  const toAddress = opts.toAddress?.trim()
  if (!toAddress || toAddress.length < 20) {
    throw new Error('Recipient Cardano address is missing. Organizer/winner must save a wallet address first.')
  }

  let active = await ensureLiveWallet(wallet, opts.walletName)
  const lovelace = adaToLovelace(opts.adaAmount)
  const metadata = buildPaymentMetadata(opts.payload, opts.adaAmount)

  const buildAndSign = async (w: IWallet) => {
    const fromAddress = await w.getChangeAddress()
    if (!fromAddress) throw new Error('Could not read your wallet address')
    const tx = new Transaction({ initiator: w })
      .sendLovelace(toAddress, lovelace)
      .setMetadata(CARDANO.metadataLabel, metadata)
    let unsignedTx: string
    try {
      unsignedTx = await tx.build()
    } catch (err) {
      throw mapBuildError(err)
    }
    let signedTx: string
    try {
      signedTx = await w.signTx(unsignedTx)
    } catch (err) {
      throw err
    }
    let txHash: string
    try {
      txHash = await w.submitTx(signedTx)
    } catch (err) {
      throw mapSubmitError(err)
    }
    return {
      txHash,
      fromAddress,
      toAddress,
      adaAmount: opts.adaAmount,
      lovelace,
      metadata,
      explorerUrl: explorerTxUrl(txHash),
    }
  }

  try {
    return await buildAndSign(active)
  } catch (err) {
    if (!isStaleWalletError(err)) {
      if (err instanceof Error && (err.message.startsWith('Failed to build') || err.message.startsWith('Submission') || err.message === STALE_WALLET_HELP || err.message.startsWith('Transaction was rejected') || err.message.startsWith('Signing failed') || err.message.startsWith('Could not') || err.message.startsWith('Recipient'))) {
        throw err
      }
      throw mapSignError(err)
    }
    const revived = await reenableWallet(opts.walletName)
    if (!revived) throw new Error(STALE_WALLET_HELP)
    active = revived
    try {
      return await buildAndSign(active)
    } catch (err2) {
      if (err2 instanceof Error && err2.message === STALE_WALLET_HELP) throw err2
      throw mapSignError(err2)
    }
  }
}

/** Resolve a safe receive address for an OnChainIn user profile */
export function requireReceiveAddress(
  address: string | undefined | null,
  who = 'Recipient',
): string {
  const a = (address || '').trim()
  if (!a || a.length < 20) {
    throw new Error(
      `${who} has no Cardano receive address saved. They must connect a wallet or paste addr_test1… in their profile / mobile wallet panel.`,
    )
  }
  return a
}
