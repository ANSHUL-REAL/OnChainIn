import { Link } from 'react-router'

type BrandLogoProps = {
  /** full = mark + "OnChainIn" text (landing / marketing only) */
  variant?: 'full' | 'icon'
  /** icon size in px */
  size?: number
  className?: string
  /** if true, wraps in Link to home */
  linkToHome?: boolean
  /** text size classes when variant is full */
  textClassName?: string
}

/**
 * Brand mark from public/logo.png (user-uploaded OnChainIn logo).
 * - Front screen: variant="full" → logo + OnChainIn
 * - Everywhere else: variant="icon" → logo only
 */
export function BrandLogo({
  variant = 'icon',
  size = 36,
  className = '',
  linkToHome = true,
  textClassName = 'text-sm font-bold tracking-[0.14em] text-[#192837]',
}: BrandLogoProps) {
  // Transparent PNG mark only (no square/block background)
  const mark = (
    <img
      src="/logo.png"
      alt={variant === 'full' ? '' : 'OnChainIn'}
      width={size}
      height={size}
      className="object-contain select-none bg-transparent"
      style={{ width: size, height: size, background: 'transparent' }}
      draggable={false}
    />
  )

  const content =
    variant === 'full' ? (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        {mark}
        <span className={textClassName}>OnChainIn</span>
      </span>
    ) : (
      <span className={`inline-flex items-center ${className}`} title="OnChainIn">
        {mark}
      </span>
    )

  if (!linkToHome) return content

  return (
    <Link to="/" className="inline-flex items-center" aria-label="OnChainIn home">
      {content}
    </Link>
  )
}
