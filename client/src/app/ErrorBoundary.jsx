// Modified for Screen 2 Screen: a recoverable render-error surface.
import { Component } from 'react'
import { WarningIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { BrandMark, Wordmark } from '@/components/Brand'
export class ErrorBoundary extends Component {
  state = {}
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex h-dvh items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <BrandMark className="mx-auto size-10 text-primary" />
          <Wordmark />
          <WarningIcon className="mx-auto size-8 text-warning" />
          <h1 className="font-display text-xl font-bold">Something interrupted the workspace</h1>
          <p className="text-sm leading-6 text-muted-foreground">{this.state.error.message}</p>
          <Button className="w-full" onClick={() => location.reload()}>
            Reload workspace
          </Button>
        </div>
      </div>
    )
  }
}
