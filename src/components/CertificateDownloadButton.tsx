import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Loader2, X, CheckCircle2 } from 'lucide-react'
import {
  downloadCertificate,
  forceDownloadFile,
  type CertificateData,
  type CertificatePngResult,
} from '@/lib/certificate'

type Props = {
  data: CertificateData
  label?: string
  className?: string
  disabled?: boolean
  /** Larger full-width CTA for participant page */
  variant?: 'default' | 'primary'
}

/**
 * Generate certificate PNG → auto-download → always open a portal modal
 * with a guaranteed Save PNG button (works even when browsers block silent downloads).
 */
export function CertificateDownloadButton({
  data,
  label = 'Download certificate',
  className = '',
  disabled = false,
  variant = 'default',
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CertificatePngResult | null>(null)

  useEffect(() => {
    return () => {
      if (result?.objectUrl) URL.revokeObjectURL(result.objectUrl)
    }
  }, [result])

  const close = () => {
    if (result?.objectUrl) URL.revokeObjectURL(result.objectUrl)
    setResult(null)
  }

  const onClick = async () => {
    setError('')
    setBusy(true)
    try {
      if (result?.objectUrl) URL.revokeObjectURL(result.objectUrl)
      const png = await downloadCertificate({
        ...data,
        participantName: data.participantName || 'Participant',
        eventName: data.eventName || 'Event',
        organizerName: data.organizerName || 'OnChainIn',
        code: data.code || 'CERT',
        date: data.date || new Date().toLocaleDateString(),
      })
      setResult(png)
    } catch (err) {
      console.error('[certificate download]', err)
      setError(err instanceof Error ? err.message : 'Could not generate certificate. Try Chrome/Edge.')
    } finally {
      setBusy(false)
    }
  }

  const saveAgain = () => {
    if (!result) return
    const status = forceDownloadFile(result.blob, result.fileName, result.dataUrl)
    if (status === 'fail') {
      setError('Browser blocked the file. Long-press the preview image → Save image, or use Chrome.')
    }
  }

  const defaultClass =
    variant === 'primary'
      ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#52670F] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#3f5010] disabled:opacity-50 sm:w-auto'
      : 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50'

  const modal =
    result &&
    createPortal(
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/55 p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Save certificate"
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div className="relative max-h-[94vh] w-full max-w-2xl overflow-auto rounded-2xl border border-[#E7E1D2] bg-white p-4 shadow-2xl sm:p-6">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 rounded-full p-1.5 text-[#5E6256] hover:bg-[#F2F2EE]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-2 flex items-center gap-2 pr-8">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-[#192837]">Certificate ready</h3>
          </div>
          <p className="text-sm text-[#5E6256]">
            Your PNG was prepared. If it did not appear in Downloads, tap <strong>Save PNG</strong>{' '}
            below (required on some phones).
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#E7E1D2] bg-[#FBF9F3] p-2">
            <img
              src={result.dataUrl || result.objectUrl}
              alt="Certificate preview"
              className="mx-auto max-h-[50vh] w-auto max-w-full select-none"
              draggable
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={saveAgain}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#52670F] px-4 py-3 text-sm font-bold text-white hover:bg-[#3f5010]"
            >
              <Download className="h-4 w-4" />
              Save PNG to device
            </button>
            <a
              href={result.dataUrl || result.objectUrl}
              download={result.fileName}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#52670F] bg-white px-4 py-3 text-sm font-bold text-[#52670F] hover:bg-[#F6FAE8]"
            >
              Download link
            </a>
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-[#E7E1D2] bg-white px-4 py-3 text-sm font-semibold text-[#5E6256] hover:bg-[#F7F6EB] sm:flex-none"
            >
              Close
            </button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-[#9AA08D]">{result.fileName}</p>
          <p className="mt-1 text-[11px] text-[#9AA08D]">
            Tip: on mobile you can also long-press the preview → Save image.
          </p>
        </div>
      </div>,
      document.body,
    )

  return (
    <div className={variant === 'primary' ? 'w-full sm:w-auto' : undefined}>
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={disabled || busy || !data.code}
        className={className || defaultClass}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? 'Creating PNG…' : label}
      </button>
      {error && (
        <p className="mt-1.5 max-w-sm text-[12px] font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
      {modal}
    </div>
  )
}
