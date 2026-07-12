import { useEffect, useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import {
  downloadCertificate,
  type CertificateData,
  type CertificatePngResult,
} from '@/lib/certificate'

type Props = {
  data: CertificateData
  /** Button label */
  label?: string
  className?: string
  disabled?: boolean
}

/**
 * Generates certificate PNG and saves it.
 * If the browser blocks auto-download after async work, shows a modal with
 * a real <a download> link (and preview) so the user can still save the file.
 */
export function CertificateDownloadButton({
  data,
  label = 'Download',
  className = '',
  disabled = false,
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
      const png = await downloadCertificate(data)
      setResult(png)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate certificate PNG.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={disabled || busy}
        className={
          className ||
          'inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50'
        }
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {busy ? 'Preparing…' : label}
      </button>
      {error && (
        <p className="mt-1 max-w-xs text-[11px] font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Save certificate"
        >
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl border border-[#E7E1D2] bg-white p-4 shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 rounded-full p-1.5 text-[#5E6256] hover:bg-[#F2F2EE]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="pr-8 text-base font-bold text-[#192837]">Your certificate is ready</h3>
            <p className="mt-1 text-sm text-[#5E6256]">
              If the file did not save automatically, use <strong>Save PNG</strong> below.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#E7E1D2] bg-[#FBF9F3]">
              <img
                src={result.objectUrl}
                alt="Certificate preview"
                className="mx-auto max-h-[55vh] w-auto max-w-full"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={result.objectUrl}
                download={result.fileName}
                className="inline-flex items-center gap-2 rounded-xl bg-[#52670F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3f5010]"
              >
                <Download className="h-4 w-4" />
                Save PNG
              </a>
              <button
                type="button"
                onClick={close}
                className="rounded-xl border border-[#E7E1D2] bg-white px-4 py-2.5 text-sm font-semibold text-[#5E6256] hover:bg-[#F7F6EB]"
              >
                Close
              </button>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#9AA08D]">{result.fileName}</p>
          </div>
        </div>
      )}
    </>
  )
}
