import { useState } from 'react'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Ask Shopify's CDN for a resized copy so tables don't download full-size photos. */
function sizedSrc(url: string, px: number): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'cdn.shopify.com') u.searchParams.set('width', String(px * 2))
    return u.toString()
  } catch {
    return url
  }
}

interface ProductThumbProps {
  src?: string
  alt: string
  /** Rendered size in px (square). */
  size?: number
  className?: string
}

/** Product featured image with a placeholder when missing or broken. */
export function ProductThumb({ src, alt, size = 40, className }: ProductThumbProps) {
  const [failed, setFailed] = useState(false)
  const box = cn('shrink-0 overflow-hidden rounded-md border bg-muted', className)

  if (!src || failed) {
    return (
      <div className={cn(box, 'flex items-center justify-center text-muted-foreground')} style={{ width: size, height: size }}>
        <Package style={{ width: size * 0.45, height: size * 0.45 }} className="opacity-50" />
      </div>
    )
  }
  return (
    <img
      src={sizedSrc(src, size)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(box, 'object-cover')}
      style={{ width: size, height: size }}
    />
  )
}
