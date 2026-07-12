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

export interface CertificatePngResult {
  blob: Blob
  fileName: string
  objectUrl: string
}

function loadImage(src: string, timeoutMs = 6000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Do NOT set crossOrigin for same-origin /logo.png — setting it without
    // proper CORS can taint the canvas and break toBlob/toDataURL.
    // data: URLs are always same-origin.
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

/** Draw very small hash text along the certificate border (not body content). */
function drawBorderHash(ctx: CanvasRenderingContext2D, hash: string, W: number, H: number) {
  const micro = `tx ${hash}`
  ctx.save()
  ctx.fillStyle = 'rgba(82, 103, 15, 0.38)'
  ctx.font = '8px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const y = H - 32
  ctx.fillText(micro, W / 2, y)

  ctx.translate(32, H / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(micro, 0, 0)

  ctx.restore()
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            resolve(blob)
            return
          }
          // Fallback via data URL
          try {
            const dataUrl = canvas.toDataURL('image/png')
            const parts = dataUrl.split(',')
            const bin = atob(parts[1] || '')
            const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            const fallback = new Blob([bytes], { type: 'image/png' })
            if (fallback.size > 0) resolve(fallback)
            else reject(new Error('Could not export certificate image (empty PNG)'))
          } catch (e) {
            reject(
              e instanceof Error
                ? e
                : new Error('Could not export certificate image (canvas blocked)'),
            )
          }
        },
        'image/png',
        1,
      )
    } catch (e) {
      reject(e instanceof Error ? e : new Error('Could not export certificate image'))
    }
  })
}

/** Paint certificate onto an off-screen canvas and return a PNG blob. */
export async function generateCertificatePng(data: CertificateData): Promise<CertificatePngResult> {
  const W = 1000
  const H = 760
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Your browser cannot draw certificates (canvas unavailable). Try Chrome or Edge.')
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
  try {
    // Relative same-origin path (no crossOrigin) — keeps canvas exportable
    const logo = await loadImage(`/logo.png`, 4000)
    const logoSize = 72
    ctx.drawImage(logo, W / 2 - logoSize / 2, 58, logoSize, logoSize)
    logoDrawn = true
  } catch {
    /* logo optional */
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
    const verifyUrl = `${window.location.origin}/verify/certificate/${encodeURIComponent(data.code)}`
    const qr = await qrToDataUrl(verifyUrl, 120)
    const qrImg = await loadImage(qr, 4000)
    ctx.drawImage(qrImg, W - 250, footY - 30, 96, 96)
    ctx.fillStyle = '#5E6256'
    ctx.font = '11px Arial, sans-serif'
    ctx.fillText('Scan to verify', W - 202, footY + 82)
  } catch {
    /* optional */
  }

  if (data.txHash) {
    drawBorderHash(ctx, data.txHash, W, H)
  }

  const blob = await canvasToBlob(canvas)
  const fileName = safeCertFileName(data.code)
  const objectUrl = URL.createObjectURL(blob)
  return { blob, fileName, objectUrl }
}

/**
 * Try every browser download path. After async work, some browsers block silent
 * a.click() — File System Access API and a visible <a download> still work.
 */
export async function tryAutoDownload(blob: Blob, fileName: string): Promise<'picker' | 'anchor' | 'none'> {
  // 1) Chrome / Edge: native save picker (reliable after await)
  const w = window as Window & {
    showSaveFilePicker?: (opts: unknown) => Promise<{
      createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }>
    }>
  }
  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'PNG image',
            accept: { 'image/png': ['.png'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return 'picker'
    } catch (err) {
      // User cancelled picker — treat as handled (don't force another download)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('cancel')) {
        return 'none'
      }
      /* fall through to anchor download */
    }
  }

  // 2) Classic blob + <a download>
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.rel = 'noopener'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    window.setTimeout(() => {
      link.remove()
      URL.revokeObjectURL(url)
    }, 4000)
    return 'anchor'
  } catch {
    return 'none'
  }
}

/** Generate PNG and attempt download. Always returns objectUrl for UI fallback save button. */
export async function downloadCertificate(data: CertificateData): Promise<CertificatePngResult> {
  const result = await generateCertificatePng(data)
  await tryAutoDownload(result.blob, result.fileName)
  return result
}
