import Link from 'next/link'

type PrimaryGhostButtonProps = {
  href: string
  label: string
  arrowAccent?: boolean
  className?: string
}

export default function PrimaryGhostButton({
  href,
  label,
  arrowAccent,
  className,
}: PrimaryGhostButtonProps) {
  return (
    <Link href={href} className={`ghost-button${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <span className={`ghost-arrow${arrowAccent ? ' accent' : ''}`} aria-hidden="true">
        &rarr;
      </span>
    </Link>
  )
}
