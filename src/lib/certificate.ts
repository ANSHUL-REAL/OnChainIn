import { qrToDataUrl } from '@/lib/qr'

/**
 * Premium downloadable certificate PNG.
 * Layout mirrors the clean Verify Certificate page (no overlapping text / stacked boxes).
 */

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
  dataUrl: string
}

const C = {
  paper: '#FBF9F3',
  ink: '#14150F',
  muted: '#5E6256',
  soft: '#9AA08D',
  brand: '#52670F',
  brandMid: '#6A7D1A',
  line: '#C9D4A8',
  card: '#F3F7E8',
  cardBorder: '#DCE8BE',
  white: '#FFFFFF',
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

async function loadLogoSafe(): Promise<HTMLImageElement | null> {
  try {
    const res = await fetch('/logo.png', { cache: 'force-cache' })
    if (!res.ok) throw new Error('missing')
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

/** Wrap text into lines that fit maxWidth (no stacked/overlapping draws). */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3,
): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let current = ''
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length >= maxLines - 1) {
      // Pack remaining words into last line with ellipsis if needed
      const rest = [word, ...words.slice(i + 1)].join(' ')
      let last = rest
      while (last.length > 3 && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1)
      }
      if (ctx.measureText(rest).width > maxWidth) last = `${last}…`
      lines.push(last)
      return lines.slice(0, maxLines)
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  centerX: number,
  startY: number,
  lineHeight: number,
) {
  lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * lineHeight)
  })
  return lines.length * lineHeight
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export function safeCertFileName(code: string): string {
  const cleaned = (code || 'certificate')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
  return `certificate-${cleaned || 'download'}.png`
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
    const tryDataUrl = () => {
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const bin = atob(dataUrl.split(',')[1] || '')
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        const fallback = new Blob([bytes], { type: 'image/png' })
        if (fallback.size > 0) resolve(fallback)
        else reject(new Error('Could not export certificate PNG'))
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Could not export certificate PNG'))
      }
    }
    window.setTimeout(() => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) resolve(blob)
            else tryDataUrl()
          },
          'image/png',
          1,
        )
      } catch {
        tryDataUrl()
      }
    }, 0)
  })
}

/** Optional microtext on bottom edge only (never collides with body). */
function drawBottomMicroHash(ctx: CanvasRenderingContext2D, hash: string, W: number, H: number) {
  if (!hash) return
  ctx.save()
  ctx.fillStyle = 'rgba(82, 103, 15, 0.28)'
  ctx.font = '9px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const short = hash.length > 48 ? `${hash.slice(0, 24)}…${hash.slice(-16)}` : hash
  ctx.fillText(`tx ${short}`, W / 2, H - 22)
  ctx.restore()
}

/**
 * Clean certificate matching the Verify page look:
 * cream paper, elegant type, single green accent line, optional Cardano badge, QR + code footer.
 */
export async function generateCertificatePng(data: CertificateData): Promise<CertificatePngResult> {
  // High-res for crisp download
  const W = 1200
  const H = 900
  const pad = 56
  const contentW = W - pad * 2
  const cx = W / 2

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) {
    throw new Error('Canvas not supported. Open in Chrome or Edge to download certificates.')
  }

  // Paper
  ctx.fillStyle = C.paper
  ctx.fillRect(0, 0, W, H)

  // Outer frame
  ctx.strokeStyle = C.brand
  ctx.lineWidth = 5
  roundedRect(ctx, 28, 28, W - 56, H - 56, 18)
  ctx.stroke()

  // Inner soft frame
  ctx.strokeStyle = C.line
  ctx.lineWidth = 1.5
  roundedRect(ctx, 44, 44, W - 88, H - 88, 12)
  ctx.stroke()

  // Subtle corner marks (small, non-overlapping)
  ctx.strokeStyle = C.line
  ctx.lineWidth = 1.5
  const c = 22
  const corners: [number, number, number, number][] = [
    [52, 52, 1, 1],
    [W - 52, 52, -1, 1],
    [52, H - 52, 1, -1],
    [W - 52, H - 52, -1, -1],
  ]
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(x, y + dy * c)
    ctx.lineTo(x, y)
    ctx.lineTo(x + dx * c, y)
    ctx.stroke()
  }

  let y = 72

  // Brand mark
  const logo = await loadLogoSafe()
  if (logo && logo.naturalWidth > 0) {
    const size = 56
    ctx.drawImage(logo, cx - size / 2, y, size, size)
    y += size + 14
  } else {
    // Fallback monogram circle
    ctx.fillStyle = C.card
    ctx.beginPath()
    ctx.arc(cx, y + 28, 28, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = C.line
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = C.brand
    ctx.font = 'bold 18px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('OCI', cx, y + 28)
    y += 70
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // Brand name
  ctx.fillStyle = C.brandMid
  ctx.font = 'bold 13px Arial, sans-serif'
  ctx.fillText('O N C H A I N I N', cx, y)
  y += 22

  // Status line
  ctx.fillStyle = C.soft
  ctx.font = '600 12px Arial, sans-serif'
  const status = data.txHash
    ? 'CARDANO-VERIFIED ATTENDANCE'
    : 'OFFICIAL EVENT CREDENTIAL'
  ctx.fillText(status, cx, y)
  y += 42

  // Title
  ctx.fillStyle = C.ink
  ctx.font = 'bold 40px Georgia, "Times New Roman", serif'
  ctx.fillText('Certificate of Achievement', cx, y)
  y += 48

  // Presented to
  ctx.fillStyle = C.muted
  ctx.font = '17px Arial, sans-serif'
  ctx.fillText('This certificate is proudly presented to', cx, y)
  y += 44

  // Name
  ctx.fillStyle = C.brand
  ctx.font = 'bold 48px Georgia, "Times New Roman", serif'
  const nameLines = wrapLines(ctx, data.participantName || 'Participant', contentW - 80, 2)
  const nameH = drawCenteredLines(ctx, nameLines, cx, y, 54)
  y += nameH + 12

  // Accent line
  ctx.strokeStyle = C.line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - 90, y)
  ctx.lineTo(cx + 90, y)
  ctx.stroke()
  y += 32

  // Role line
  ctx.fillStyle = C.muted
  ctx.font = '16px Arial, sans-serif'
  ctx.fillText(`for ${data.role || 'participation'} in`, cx, y)
  y += 36

  // Event title (wrap)
  ctx.fillStyle = C.ink
  ctx.font = 'bold 28px Georgia, "Times New Roman", serif'
  const eventLines = wrapLines(ctx, data.eventName || 'Event', contentW - 60, 3)
  const eventH = drawCenteredLines(ctx, eventLines, cx, y, 34)
  y += eventH + 28

  // Meta row: date · organizer
  ctx.fillStyle = C.muted
  ctx.font = '15px Arial, sans-serif'
  const meta = [
    data.date ? `Event date: ${data.date}` : '',
    data.organizerName ? `Organized by ${data.organizerName}` : 'Organized by OnChainIn',
  ]
    .filter(Boolean)
    .join('   ·   ')
  ctx.fillText(meta, cx, y)
  y += 36

  // Cardano badge — single clean pill, never stacked
  if (data.txHash) {
    const badgeW = 360
    const badgeH = 52
    const bx = cx - badgeW / 2
    const by = y
    ctx.fillStyle = C.card
    roundedRect(ctx, bx, by, badgeW, badgeH, 12)
    ctx.fill()
    ctx.strokeStyle = C.cardBorder
    ctx.lineWidth = 1
    roundedRect(ctx, bx, by, badgeW, badgeH, 12)
    ctx.stroke()

    ctx.fillStyle = C.brand
    ctx.font = 'bold 15px Arial, sans-serif'
    ctx.fillText('✓  Verified on Cardano', cx, by + 22)
    ctx.fillStyle = C.brandMid
    ctx.font = '12px Arial, sans-serif'
    ctx.fillText('Scan QR to open full proof · Preprod', cx, by + 40)
    y += badgeH + 36
  } else {
    y += 8
  }

  // Footer zone — fixed bottom band so nothing collides
  const footTop = Math.max(y + 20, H - 200)
  const footY = footTop

  // Divider
  ctx.strokeStyle = C.line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad + 40, footY)
  ctx.lineTo(W - pad - 40, footY)
  ctx.stroke()

  // Left: organizer signature
  const sigX = pad + 120
  const sigY = footY + 50
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 1.25
  ctx.beginPath()
  ctx.moveTo(sigX - 70, sigY)
  ctx.lineTo(sigX + 70, sigY)
  ctx.stroke()
  ctx.fillStyle = C.ink
  ctx.font = 'bold 15px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(data.organizerName || 'Organizer', sigX, sigY + 22)
  ctx.fillStyle = C.muted
  ctx.font = '12px Arial, sans-serif'
  ctx.fillText('Organizer', sigX, sigY + 40)

  // Center: certificate code
  const code = data.code || 'CERT'
  ctx.fillStyle = C.brand
  ctx.font = 'bold 15px "Courier New", monospace'
  ctx.fillText(code, cx, footY + 48)
  ctx.fillStyle = C.soft
  ctx.font = '12px Arial, sans-serif'
  ctx.fillText('Certificate ID · scan QR to verify', cx, footY + 70)

  // Right: QR
  try {
    const verifyUrl = `${window.location.origin}/verify/certificate/${encodeURIComponent(code)}`
    const qr = await qrToDataUrl(verifyUrl, 140)
    const qrImg = await loadImageFromUrl(qr, 4000)
    const qrSize = 100
    const qrX = W - pad - 130
    const qrY = footY + 18
    // white plate behind QR
    ctx.fillStyle = C.white
    roundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 28, 8)
    ctx.fill()
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    ctx.fillStyle = C.muted
    ctx.font = '11px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Scan to verify', qrX + qrSize / 2, qrY + qrSize + 14)
  } catch {
    /* QR optional */
  }

  // Micro hash on outer bottom edge only
  if (data.txHash) {
    drawBottomMicroHash(ctx, data.txHash, W, H)
  }

  const blob = await canvasToBlob(canvas)
  const fileName = safeCertFileName(code)
  const objectUrl = URL.createObjectURL(blob)
  const dataUrl = await blobToDataUrl(blob)
  return { blob, fileName, objectUrl, dataUrl }
}

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

export async function downloadCertificate(data: CertificateData): Promise<CertificatePngResult> {
  if (!data.code?.trim()) {
    throw new Error('Certificate code is missing. Ask the organizer to re-issue the certificate.')
  }
  const result = await generateCertificatePng(data)
  forceDownloadFile(result.blob, result.fileName, result.dataUrl)
  return result
}
