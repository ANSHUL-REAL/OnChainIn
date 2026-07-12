/**
 * Blockfrost API helpers for OnChainIn.
 * Reads chain state (tx confirm, address balance) — does not replace wallet submit.
 *
 * Env: VITE_BLOCKFROST_PROJECT_ID (e.g. preprod...)
 *      VITE_CARDANO_NETWORK = preprod | mainnet
 */

const projectId = (import.meta.env.VITE_BLOCKFROST_PROJECT_ID as string | undefined)?.trim() || ''
const network = ((import.meta.env.VITE_CARDANO_NETWORK as string | undefined) || 'preprod').toLowerCase()

export function isBlockfrostConfigured(): boolean {
  if (!projectId || projectId.length < 10) return false
  if (projectId.includes('YOUR_') || projectId.includes('XXXX')) return false
  return true
}

export function blockfrostBaseUrl(): string {
  if (network === 'mainnet') return 'https://cardano-mainnet.blockfrost.io/api/v0'
  return 'https://cardano-preprod.blockfrost.io/api/v0'
}

export type TxChainStatus =
  | { status: 'disabled'; message: string }
  | { status: 'pending'; message: string }
  | { status: 'confirmed'; message: string; block: string; slot: number; fees: string; index: number }
  | { status: 'not_found'; message: string }
  | { status: 'error'; message: string }

export type AddressBalance = {
  address: string
  lovelace: number
  ada: number
  raw?: string
}

async function bfFetch(path: string): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  if (!isBlockfrostConfigured()) {
    return { ok: false, status: 0, json: null, text: 'Blockfrost not configured' }
  }
  const res = await fetch(`${blockfrostBaseUrl()}${path}`, {
    headers: {
      project_id: projectId,
      Accept: 'application/json',
    },
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    /* ignore */
  }
  return { ok: res.ok, status: res.status, json, text }
}

/**
 * Look up a transaction on Preprod/Mainnet via Blockfrost.
 * 404 → not indexed yet (pending) or invalid hash.
 */
export async function getTransactionStatus(txHash: string): Promise<TxChainStatus> {
  const hash = (txHash || '').trim()
  if (!hash) {
    return { status: 'error', message: 'No transaction hash' }
  }
  if (!isBlockfrostConfigured()) {
    return {
      status: 'disabled',
      message: 'Blockfrost project id not set — open explorer to verify manually.',
    }
  }

  const { ok, status, json, text } = await bfFetch(`/txs/${hash}`)

  if (status === 404) {
    return {
      status: 'not_found',
      message: 'Transaction not found yet on Blockfrost (may still be pending).',
    }
  }
  if (!ok) {
    return {
      status: 'error',
      message: `Blockfrost error ${status}: ${text.slice(0, 120)}`,
    }
  }

  const tx = json as {
    hash?: string
    block?: string
    slot?: number
    index?: number
    fees?: string
  }

  if (tx?.block) {
    return {
      status: 'confirmed',
      message: 'Transaction confirmed on Cardano (via Blockfrost).',
      block: tx.block,
      slot: Number(tx.slot) || 0,
      fees: tx.fees || '0',
      index: Number(tx.index) || 0,
    }
  }

  return { status: 'pending', message: 'Transaction seen but not fully confirmed yet.' }
}

/**
 * Poll until confirmed or timeout (default ~45s).
 */
export async function waitForTransaction(
  txHash: string,
  opts?: { maxAttempts?: number; intervalMs?: number; onTick?: (s: TxChainStatus) => void },
): Promise<TxChainStatus> {
  const maxAttempts = opts?.maxAttempts ?? 15
  const intervalMs = opts?.intervalMs ?? 3000

  for (let i = 0; i < maxAttempts; i++) {
    const s = await getTransactionStatus(txHash)
    opts?.onTick?.(s)
    if (s.status === 'confirmed' || s.status === 'disabled' || s.status === 'error') {
      return s
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return getTransactionStatus(txHash)
}

/**
 * Read address balance (lovelace + ADA).
 */
export async function getAddressBalance(address: string): Promise<AddressBalance | null> {
  const addr = (address || '').trim()
  if (!addr || addr.length < 20) return null
  if (!isBlockfrostConfigured()) return null

  const { ok, json } = await bfFetch(`/addresses/${addr}`)
  if (!ok || !json) return null

  const data = json as { address?: string; amount?: Array<{ unit: string; quantity: string }> }
  const lovelaceStr = data.amount?.find((a) => a.unit === 'lovelace')?.quantity || '0'
  const lovelace = Number(lovelaceStr) || 0
  return {
    address: data.address || addr,
    lovelace,
    ada: lovelace / 1_000_000,
  }
}

/** Optional: fetch tx metadata labels (e.g. 674) */
export async function getTransactionMetadata(txHash: string): Promise<unknown[] | null> {
  const hash = (txHash || '').trim()
  if (!hash || !isBlockfrostConfigured()) return null
  const { ok, json } = await bfFetch(`/txs/${hash}/metadata`)
  if (!ok) return null
  return Array.isArray(json) ? json : null
}

export function feesLovelaceToAda(fees: string): string {
  const n = Number(fees) || 0
  return (n / 1_000_000).toFixed(4)
}
