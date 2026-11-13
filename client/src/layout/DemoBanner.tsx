import { FlaskIcon, ArrowSquareOutIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export function DemoBanner() {
  return (
    <div className="flex min-h-9 shrink-0 items-center gap-2 border-b bg-primary/8 px-4 text-xs text-accent-foreground sm:px-6">
      <FlaskIcon className="size-4 shrink-0" />
      <span>
        <strong className="font-semibold">Interactive preview.</strong>{' '}
        <span className="hidden sm:inline">Local demo data and a simulated screen — no remote connection.</span>
        <span className="sm:hidden">Local demo, not a live stream.</span>
      </span>
      <Button asChild variant="link" size="xs" className="ml-auto h-auto shrink-0 p-0 text-accent-foreground">
        <a href={location.pathname} aria-label="Exit preview and connect to a live server">
          Exit preview <ArrowSquareOutIcon className="size-3" />
        </a>
      </Button>
    </div>
  )
}
