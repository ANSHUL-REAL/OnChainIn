import { qrToDataUrl } from '@/lib/qr'

// Downloadable certificate PNG — clean layout; full tx hash only as tiny border microtext.
// Full hash + explorer verification live on the public verify page.

export interface CertificateData {
  participantName: string
  eventName: string
  date: string
  organizerName: string
  code: string
  role?: string
  /** Cardano Preprod attendance transaction (stored in border microtext only) */
  txHash?: string
  explorerUrl?: string
  walletAddress?: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 8 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1)
  }
  return `${t}…`
}

/** Draw very small hash text along the certificate border (not body content). */
function drawBorderHash(ctx: CanvasRenderingContext2D, hash: string, W: number, H: number) {
  const micro = `tx ${hash}`
  ctx.save()
  ctx.fillStyle = 'rgba(82, 103, 15, 0.38)'
  ctx.font = '8px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Bottom edge, between outer and inner border — only readable when zoomed
  const y = H - 32
  ctx.fillText(micro, W / 2, y)

  // Left edge (rotated)
  ctx.translate(32, H / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(micro, 0, 0)

  ctx.restore()
}

export async function downloadCertificate(data: CertificateData): Promise<void> {
  const W = 1000
  const H = 760
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Soft paper background
  ctx.fillStyle = '#FBF9F3'
  ctx.fillRect(0, 0, W, H)

  // Outer double border
  ctx.strokeStyle = '#52670F'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, W - 48, H - 48)
  ctx.strokeStyle = '#C9D4A8'
  ctx.lineWidth = 1.5
  ctx.strokeRect(40, 40, W - 80, H - 80)

  // Corner accents
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

  // Brand logo at top center
  let logoDrawn = false
  try {
    const logo = await loadImage(`${window.location.origin}/logo.png`)
    const logoSize = 72
    ctx.drawImage(logo, W / 2 - logoSize / 2, 58, logoSize, logoSize)
    logoDrawn = true
  } catch {
    /* logo optional if offline */
  }

  const headerY = logoDrawn ? 150 : 100

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
  ctx.fillText(fitText(ctx, data.participantName || 'Participant', W - 140), W / 2, headerY + 162)

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
  ctx.fillText(fitText(ctx, data.eventName || 'Event', W - 140), W / 2, headerY + 252)

  ctx.fillStyle = '#5E6256'
  ctx.font = '15px Arial, sans-serif'
  ctx.fillText(`Event date: ${data.date}`, W / 2, headerY + 288)
  ctx.fillText(`Organized by ${data.organizerName || 'OnChainIn'}`, W / 2, headerY + 312)

  // Clean verification note — no big hash block on the face of the certificate
  const noteY = headerY + 360
  if (data.txHash) {
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

  // Footer: organizer + code + QR
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
  ctx.fillText(data.code, W / 2, footY)
  ctx.fillStyle = '#9aa08f'
  ctx.font = '11px Arial, sans-serif'
  ctx.fillText(`Verify at /verify/certificate/${data.code}`, W / 2, footY + 22)

  try {
    const verifyUrl = `${window.location.origin}/verify/certificate/${data.code}`
    const qr = await qrToDataUrl(verifyUrl, 120)
    const qrImg = await loadImage(qr)
    ctx.drawImage(qrImg, W - 250, footY - 30, 96, 96)
    ctx.fillStyle = '#5E6256'
    ctx.font = '11px Arial, sans-serif'
    ctx.fillText('Scan to verify', W - 202, footY + 82)
  } catch {
    /* optional */
  }

  // Full hash only as tiny border microtext (zoom to read) — not in body layout
  if (data.txHash) {
    drawBorderHash(ctx, data.txHash, W, H)
  }

  const link = document.createElement('a')
  link.download = `certificate-${data.code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
