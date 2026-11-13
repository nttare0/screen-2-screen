// Modified for Screen 2 Screen: a compact control dock below the shared screen.
import { useStore } from 'zustand'
import { selectControlling } from '@m1k1o/neko'
import { MouseIcon, LockIcon } from '@phosphor-icons/react'
import { useClient } from '@/state/provider'
import { Controls } from '@/features/controls/Controls'
import { Emotes } from '@/features/emotes/Emotes'
import { Separator } from '@/components/ui/separator'
export function RoomBar() {
  const client = useClient()
  const hosting = useStore(client.store, selectControlling)
  const locked = useStore(client.store, (s) => s.settings.locked_controls)
  return (
    <div
      data-testid="room-bar"
      className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2.5 shadow-sm"
    >
      <Controls />
      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
      <Emotes />
      <div className="ml-auto hidden items-center gap-1.5 pr-1 text-xs text-muted-foreground xl:flex">
        {locked ? <LockIcon className="size-3.5" /> : <MouseIcon className="size-3.5" />}
        {hosting ? 'Your input is shared' : locked ? 'Controls are locked' : 'One shared cursor'}
      </div>
    </div>
  )
}
