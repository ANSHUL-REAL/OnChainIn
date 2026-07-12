/**
 * Cardano (Mesh.js) helpers for OnChainIn / OnChainIn hybrid.
 * Records attendance & proofs as transaction metadata on Preprod.
 */
import { Transaction } from '@meshsdk/core'
import type { IWallet } from '@meshsdk/common'

export const CARDANO = {
  network: (import.meta.env.VITE_CARDANO_NETWORK as string) || 'preprod',
  metadataLabel: 674,
  appId: 'OnChainIn',
  checkInLovelace: '1000000',
  explorerBase:
    (import.meta.env.VITE_CARDANO_NETWORK as string) === 'mainnet'
      ? 'https://cardanoscan.io'
      : 'https://preprod.cardanoscan.io',
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

export type OnChainProofKind =
  | 'attendance'
  | 'registration'
  | 'volunteer'
  | 'certificate'

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
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('utxo') || msg.toLowerCase().includes('insufficient')) {
      throw new Error(
        'Insufficient Preprod ADA. Fund your wallet from the Cardano testnet faucet, then try again.',
      )
    }
    throw new Error(`Failed to build transaction: ${msg}`)
  }

  let signedTx: string
  try {
    signedTx = await wallet.signTx(unsignedTx)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (
      msg.toLowerCase().includes('declin') ||
      msg.toLowerCase().includes('reject') ||
      msg.toLowerCase().includes('cancel') ||
      msg.toLowerCase().includes('user')
    ) {
      throw new Error('Transaction was rejected in your wallet.')
    }
    throw new Error(`Signing failed: ${msg}`)
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
