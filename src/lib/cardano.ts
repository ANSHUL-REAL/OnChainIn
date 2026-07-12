/**
 * Cardano (Mesh.js) helpers for OnChainIn.
 * - Attendance proof (self-send + metadata)
 * - ADA payments: fees, sponsorship, prizes, volunteer payouts
 */
import { Transaction } from '@meshsdk/core'
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

export function buildMetadata(payload: OnChainProofPayload) {
  const timestamp = Math.floor(Date.now() / 1000)
  return {
    app: CARDANO.appId,
    kind: payload.kind,
    event_id: payload.eventId,
    event: payload.eventTitle,
    registration_code: payload.registrationCode || '',
    role: payload.role || 'participant',
    participant_id: payload.participantId || '',
    session: payload.session || 'Main',
    location: payload.location || '',
    timestamp,
    msg: [
      `OnChainIn|${payload.kind}|${payload.eventTitle}|${payload.registrationCode || ''}|${timestamp}`,
    ],
  }
}

export function buildPaymentMetadata(payload: AdaPaymentPayload, adaAmount: number) {
  const timestamp = Math.floor(Date.now() / 1000)
  return {
    app: CARDANO.appId,
    kind: payload.kind,
    event_id: payload.eventId,
    event: payload.eventTitle,
    label: payload.label || payload.kind,
    to_user_id: payload.toUserId || '',
    from_role: payload.fromRole || '',
    note: payload.note || '',
    ada: adaAmount,
    timestamp,
    msg: [
      `OnChainIn|${payload.kind}|${payload.eventTitle}|${adaAmount}ADA|${timestamp}`,
    ],
  }
}

function mapBuildError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.toLowerCase().includes('utxo') || msg.toLowerCase().includes('insufficient')) {
    return new Error(
      'Insufficient Preprod ADA. Fund your wallet from the Cardano faucet, then try again.',
    )
  }
  return new Error(`Failed to build transaction: ${msg}`)
}

function mapSignError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  if (
    msg.toLowerCase().includes('declin') ||
    msg.toLowerCase().includes('reject') ||
    msg.toLowerCase().includes('cancel') ||
    msg.toLowerCase().includes('user')
  ) {
    return new Error('Transaction was rejected in your wallet.')
  }
  return new Error(`Signing failed: ${msg}`)
}

/**
 * Self-transfer with attendance/proof metadata. User signs in wallet.
 */
export async function submitOnChainProof(
  wallet: IWallet,
  payload: OnChainProofPayload,
): Promise<{ txHash: string; walletAddress: string; metadata: ReturnType<typeof buildMetadata> }> {
  if (!wallet) throw new Error('Wallet not connected')

  const address = await wallet.getChangeAddress()
  if (!address) throw new Error('Could not read wallet address')

  const metadata = buildMetadata(payload)

  const tx = new Transaction({ initiator: wallet })
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
    signedTx = await wallet.signTx(unsignedTx)
  } catch (err) {
    throw mapSignError(err)
  }

  let txHash: string
  try {
    txHash = await wallet.submitTx(signedTx)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Submission failed: ${msg}`)
  }

  return { txHash, walletAddress: address, metadata }
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

  const fromAddress = await wallet.getChangeAddress()
  if (!fromAddress) throw new Error('Could not read your wallet address')

  const lovelace = adaToLovelace(opts.adaAmount)
  const metadata = buildPaymentMetadata(opts.payload, opts.adaAmount)

  const tx = new Transaction({ initiator: wallet })
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
    signedTx = await wallet.signTx(unsignedTx)
  } catch (err) {
    throw mapSignError(err)
  }

  let txHash: string
  try {
    txHash = await wallet.submitTx(signedTx)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Submission failed: ${msg}`)
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
