import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { CameraOff } from 'lucide-react'

interface CameraScannerProps {
  onCode: (code: string) => void
  /** Ignore repeated decodes of the same text within this window (ms). */
  dedupeMs?: number
}

const FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]

/**
 * Continuous camera decoder (rear camera preferred). Loaded lazily by the
 * Scan page because ZXing is a few hundred KB. Requires a secure context
 * (HTTPS or localhost) — iOS Safari refuses getUserMedia otherwise.
 */
export default function CameraScanner({ onCode, dedupeMs = 1500 }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onCodeRef = useRef(onCode)
  // Secure-context support is known before mount, so it seeds the state
  // instead of being set from inside the effect.
  const [error, setError] = useState<string | null>(() =>
    !window.isSecureContext || !navigator.mediaDevices?.getUserMedia
      ? 'Camera needs a secure connection (HTTPS or localhost). Use a USB scanner or type the code instead.'
      : null
  )

  // Keep the latest callback without restarting the camera on every render.
  useEffect(() => {
    onCodeRef.current = onCode
  }, [onCode])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return

    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS)
    hints.set(DecodeHintType.TRY_HARDER, true)
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 })

    let controls: IScannerControls | null = null
    let stream: MediaStream | null = null
    let cancelled = false
    let lastText = ''
    let lastAt = 0

    // We own the MediaStream ourselves (rather than letting ZXing open it) so a
    // cancelled start — e.g. React's dev-mode double mount — can release its
    // tracks without touching the <video> element a newer start is using.
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        controls = await reader.decodeFromStream(s, video, (result) => {
          if (!result) return
          const text = result.getText().trim()
          const now = Date.now()
          if (!text || (text === lastText && now - lastAt < dedupeMs)) return
          lastText = text
          lastAt = now
          navigator.vibrate?.(60)
          onCodeRef.current(text)
        })
        if (cancelled) controls.stop()
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const name = e instanceof Error ? e.name : ''
        setError(
          name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access for this site and try again.'
            : name === 'NotFoundError' || name === 'OverconstrainedError'
              ? 'No usable camera found on this device.'
              : 'Could not start the camera.'
        )
      })

    return () => {
      cancelled = true
      controls?.stop()
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [dedupeMs])

  if (error) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        <CameraOff className="size-8 opacity-60" />
        {error}
      </div>
    )
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} className="size-full object-cover" playsInline muted autoPlay />
      <div className="pointer-events-none absolute inset-[15%] rounded-lg border-2 border-white/70" />
    </div>
  )
}
