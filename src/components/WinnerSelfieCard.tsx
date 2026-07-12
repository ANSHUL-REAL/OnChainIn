import { useRef, useState } from 'react'
import { Camera, Sparkles, Trophy, Loader2 } from 'lucide-react'
import store from '@/data/store'
import type { Event } from '@/types'

/** Resize image file → compressed JPEG data URL (fits localStorage) */
async function compressSelfie(file: File, maxW = 480, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxW / bitmap.width)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', quality)
}

type Props = {
  event: Event
  userId: string
  walletAddress?: string
  /** e.g. certificate role Winner / Champion */
  highlightLabel?: string
}

/**
 * After attendance / win: claim a selfie spotlight (prize / social offer).
 */
export function WinnerSelfieCard({ event, userId, walletAddress, highlightLabel }: Props) {
  const existing = store.getWinnerSelfieForEvent(event.id, userId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(existing?.selfie_data_url || '')
  const [note, setNote] = useState(existing?.note || '')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(Boolean(existing))
  const [error, setError] = useState('')

  const onFile = async (file: File | null) => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      if (!file.type.startsWith('image/')) throw new Error('Please choose a photo')
      if (file.size > 8 * 1024 * 1024) throw new Error('Photo too large (max 8MB)')
      const dataUrl = await compressSelfie(file)
      setPreview(dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read photo')
    } finally {
      setBusy(false)
    }
  }

  const claim = () => {
    if (!preview) {
      setError('Add a selfie first')
      return
    }
    setBusy(true)
    setError('')
    try {
      store.saveWinnerSelfie({
        eventId: event.id,
        userId,
        selfieDataUrl: preview,
        walletAddress,
        note: note.trim() || `${highlightLabel || 'Winner'} selfie for ${event.title}`,
      })
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <Trophy className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
            Winner spotlight
          </p>
          <h3 className="mt-1 text-sm font-bold text-[#192837]">{event.title}</h3>
          <p className="mt-1 text-xs leading-5 text-[#5E6256]">
            Capture a selfie to claim prize / merch offers and pin a spotlight moment on your proof
            passport. Works fully on phone — no extension needed.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-200 bg-white sm:w-36">
          {preview ? (
            <img src={preview} alt="Winner selfie" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-[#9AA08D]">
              <Camera className="mx-auto h-8 w-8 opacity-50" />
              <p className="mt-1 text-[10px]">No selfie yet</p>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 sm:w-auto"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {preview ? 'Retake / change photo' : 'Take or upload selfie'}
          </button>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (team name, prize tier…)"
            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-[#192837] placeholder:text-[#9AA08D] focus:outline-none"
          />
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <button
            type="button"
            disabled={busy || !preview}
            onClick={claim}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 sm:w-auto"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {done ? 'Update winner claim' : 'Claim winner offer with selfie'}
          </button>
          {done && (
            <p className="text-[11px] font-semibold text-emerald-700">
              Saved to your passport · organizer can use this for prizes / shout-outs
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
