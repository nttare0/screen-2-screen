import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={cn('size-9', className)}>
      <rect x="3" y="7" width="27" height="21" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <rect x="10" y="13" width="27" height="21" rx="6" fill="var(--sidebar)" stroke="currentColor" strokeWidth="2.5" />
      <path d="m21 19 7 4.5-7 4.5V19Z" fill="currentColor" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-display text-[17px] font-extrabold tracking-[-0.7px]', className)}>
      screen<span className="text-primary">2</span>screen
    </span>
  )
}
