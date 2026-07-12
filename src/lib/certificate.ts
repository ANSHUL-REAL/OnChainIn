import { qrToDataUrl } from '@/lib/qr'

// Downloadable certificate PNG — clean layout; full tx hash only as tiny border microtext.

export interface CertificateData {
  participantName: string
  eventName: string
  date: string
  organizerName: string
  code: string
  role?: string
  txHash?: string
  explorerUrl?: string
  walletAddress?: string
}

export interface CertificatePngResult {
  blob: Blob
  fileName: string
  objectUrl: string
  /** data:image/png;base64,... — best for mobile Safari download attr */
  dataUrl: string
}

function loadImageFromUrl(src: string, timeoutMs = 5000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const timer = window.setTimeout(() => {
      try {
        img.src = ''
      } catch {
        /* ignore */
      }
      reject(new Error('Image load timed out'))
    }, timeoutMs)
    img.onload = () => {
      window.clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error('Image failed to load'))
    }
    img.src = src
  })
}

/** Fetch same-origin assets as blob URLs so the canvas never gets tainted. */
async function loadLogoSafe(): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch('/logo.png', { cache: 'force-cache' })
    if (!res.ok) throw new Error('logo missing')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    try {
      return await loadImageFromUrl(url, 4000)
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch {
    try {
      return await loadImageFromUrl('/logo.png', 2500)
    } catch {
      return null
    }
  }
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 8 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1)
  }
  return `${t}…`
}

export function safeCertFileName(code: string): string {
  const cleaned = (code || 'certificate')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
  return `certificate-${cleaned || 'download'}.png`
}

function drawBorderHash(ctx: CanvasRenderingContext2D, hash: string, W: number, H: number) {
  const micro = `tx ${hash}`
  ctx.save()
  ctx.fillStyle = 'rgba(82, 103, 15, 0.38)'
  ctx.font = '8px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(micro, W / 2, H - 32)
  ctx.translate(32, H / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(micro, 0, 0)
  ctx.restore()
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read certificate image'))
    reader.readAsDataURL(blob)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Some browsers need a tick before toBlob after heavy drawing
    const run = () => {
      try {
        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size > 0) {
                resolve(blob)
                return
              }
              tryDataUrl()
            },
            'image/png',
            1,
          )
        } else {
          tryDataUrl()
        }
      } catch {
        tryDataUrl()
      }
    }
    const tryDataUrl = () => {
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const parts = dataUrl.split(',')
        const bin = atob(parts[1] || '')
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        const fallback = new Blob([bytes], { type: 'image/png' })
        if (fallback.size > 0) resolve(fallback)
        else reject(new Error('Could not export certificate PNG'))
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Could not export certificate PNG'))
      }
    }
    window.setTimeout(run, 0)
  })
}

/** Paint certificate and return blob + URLs for download UI. */
export async function generateCertificatePng(data: CertificateData): Promise<CertificatePngResult> {
  const W = 1000
  const H = 760
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) {
    throw new Error('Canvas not supported. Open in Chrome or Edge to download certificates.')
  }

  ctx.fillStyle = '#FBF9F3'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = '#52670F'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, W - 48, H - 48)
  ctx.strokeStyle = '#C9D4A8'
  ctx.lineWidth = 1.5
  ctx.strokeRect(40, 40, W - 80, H - 80)

  ctx.strokeStyle = '#C9D4A8'
  ctx.lineWidth = 1
  for (const [x, y, dx, dy] of [
    [48, 48, 1, 1],
    [W - 48, 48, -1, 1],
    [48, H - 48, 1, -1],
    [W - 48, H - 48, -1, -1],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(x, y + dy * 28)
    ctx.lineTo(x, y)
    ctx.lineTo(x + dx * 28, y)
    ctx.stroke()
  }

  let logoDrawn = false
  const logo = await loadLogoSafe()
  if (logo) {
    const logoSize = 72
    ctx.drawImage(logo, W / 2 - logoSize / 2, 58, logoSize, logoSize)
    logoDrawn = true
  }

  const headerY = logoDrawn ? 150 : 100
  const name = data.participantName || 'Participant'
  const eventName = data.eventName || 'Event'
  const code = data.code || 'CERT-UNKNOWN'

  ctx.fillStyle = '#6A7D1A'
  ctx.font = 'bold 13px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ONCHAININ', W / 2, headerY)
  ctx.fillStyle = '#9AA08D'
  ctx.font = '12px Arial, sans-serif'
  ctx.fillText(
    data.txHash ? 'CARDANO-VERIFIED ATTENDANCE' : 'OFFICIAL EVENT CREDENTIAL',
    W / 2,
    headerY + 22,
  )

  ctx.fillStyle = '#14150F'
  ctx.font = 'bold 28px Georgia, serif'
  ctx.fillText('Certificate of Achievement', W / 2, headerY + 62)

  ctx.fillStyle = '#5E6256'
  ctx.font = '17px Arial, sans-serif'
  ctx.fillText('This certificate is proudly presented to', W / 2, headerY + 108)

  ctx.fillStyle = '#52670F'
  ctx.font = 'bold 40px Georgia, serif'
  ctx.fillText(fitText(ctx, name, W - 140), W / 2, headerY + 162)

  ctx.strokeStyle = '#C9D4A8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W / 2 - 180, headerY + 180)
  ctx.lineTo(W / 2 + 180, headerY + 180)
  ctx.stroke()

  ctx.fillStyle = '#5E6256'
  ctx.font = '17px Arial, sans-serif'
  ctx.fillText(`for ${data.role || 'participation'} in`, W / 2, headerY + 216)

  ctx.fillStyle = '#14150F'
  ctx.font = 'bold 24px Georgia, serif'
  ctx.fillText(fitText(ctx, eventName, W - 140), W / 2, headerY + 252)

  ctx.fillStyle = '#5E6256'
  ctx.font = '15px Arial, sans-serif'
  ctx.fillText(`Event date: ${data.date || '—'}`, W / 2, headerY + 288)
  ctx.fillText(`Organized by ${data.organizerName || 'OnChainIn'}`, W / 2, headerY + 312)

  if (data.txHash) {
    const noteY = headerY + 360
    const noteW = 420
    const noteH = 44
    const noteX = (W - noteW) / 2
    ctx.fillStyle = '#EEF5D9'
    ctx.fillRect(noteX, noteY, noteW, noteH)
    ctx.strokeStyle = '#C9D4A8'
    ctx.lineWidth = 1
    ctx.strokeRect(noteX, noteY, noteW, noteH)
    ctx.fillStyle = '#52670F'
    ctx.font = 'bold 13px Arial, sans-serif'
    ctx.fillText('✓ Verified on Cardano', W / 2, noteY + 18)
    ctx.fillStyle = '#6A7D1A'
    ctx.font = '11px Arial, sans-serif'
    ctx.fillText('Scan QR or open verify link for full tx proof', W / 2, noteY + 34)
  }

  const footY = 620
  ctx.textAlign = 'center'
  ctx.strokeStyle = '#14150F'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(140, footY)
  ctx.lineTo(340, footY)
  ctx.stroke()
  ctx.fillStyle = '#14150F'
  ctx.font = 'bold 15px Arial, sans-serif'
  ctx.fillText(data.organizerName || 'Organizer', 240, footY + 22)
  ctx.fillStyle = '#5E6256'
  ctx.font = '12px Arial, sans-serif'
  ctx.fillText('Organizer', 240, footY + 42)

  ctx.fillStyle = '#52670F'
  ctx.font = '13px "Courier New", monospace'
  ctx.fillText(code, W / 2, footY)
  ctx.fillStyle = '#9aa08f'
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(`Verify at /verify/certificate/${code}`, W / 2, footY + 22)

  try {
    const verifyUrl = `${window.location.origin}/verify/certificate/${encodeURIComponent(code)}`
    const qr = await qrToDataUrl(verifyUrl, 120)
    const qrImg = await loadImageFromUrl(qr, 4000)
    ctx.drawImage(qrImg, W - 250, footY - 30, 96, 96)
    ctx.fillStyle = '#5E6256'
    ctx.font = '11px Arial, sans-serif'
    ctx.fillText('Scan to verify', W - 202, footY + 82)
  } catch {
    /* QR optional */
  }

  if (data.txHash) {
    drawBorderHash(ctx, data.txHash, W, H)
  }

  const blob = await canvasToBlob(canvas)
  const fileName = safeCertFileName(code)
  const objectUrl = URL.createObjectURL(blob)
  const dataUrl = await blobToDataUrl(blob)
  return { blob, fileName, objectUrl, dataUrl }
}

/**
 * Force a browser download. Uses several strategies because mobile Safari and
 * desktop Chrome behave differently after async canvas work.
 */
export function forceDownloadFile(
  blob: Blob,
  fileName: string,
  dataUrl?: string,
): 'ok' | 'opened' | 'fail' {
  try {
    const nav = window.navigator as Navigator & {
      msSaveOrOpenBlob?: (b: Blob, name?: string) => boolean
    }
    if (typeof nav.msSaveOrOpenBlob === 'function') {
      nav.msSaveOrOpenBlob(blob, fileName)
      return 'ok'
    }
  } catch {
    /* continue */
  }

  // Prefer data URL for download attribute (works better on many mobile browsers)
  const href = dataUrl && dataUrl.startsWith('data:') ? dataUrl : URL.createObjectURL(blob)
  const createdObjectUrl = href.startsWith('blob:')

  try {
    const link = document.createElement('a')
    link.href = href
    link.download = fileName
    link.rel = 'noopener'
    link.type = 'image/png'
    link.style.position = 'fixed'
    link.style.left = '-9999px'
    document.body.appendChild(link)
    link.click()
    window.setTimeout(() => {
      link.remove()
      if (createdObjectUrl) URL.revokeObjectURL(href)
    }, 5000)
    return 'ok'
  } catch {
    try {
      const opened = window.open(href, '_blank', 'noopener,noreferrer')
      if (opened) return 'opened'
    } catch {
      /* ignore */
    }
    if (createdObjectUrl) URL.revokeObjectURL(href)
    return 'fail'
  }
}

/** Generate PNG and try download. Always returns URLs for the save modal. */
export async function downloadCertificate(data: CertificateData): Promise<CertificatePngResult> {
  if (!data.code?.trim()) {
    throw new Error('Certificate code is missing. Ask the organizer to re-issue the certificate.')
  }
  const result = await generateCertificatePng(data)
  forceDownloadFile(result.blob, result.fileName, result.dataUrl)
  return result
}
