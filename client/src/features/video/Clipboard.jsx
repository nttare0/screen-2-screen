// Modified for Screen 2 Screen: clipboard fallback on the shadcn popover and textarea.
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { useClient } from '@/state/provider'
import { PopoverContent } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
export function Clipboard() {
  const client = useClient()
  const remote = useStore(client.store, (s) => s.control.clipboard?.text ?? '')
  const [text, setText] = useState(remote)
  useEffect(() => setText(remote), [remote])
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <PopoverContent side="left" align="end" className="w-80 space-y-2 p-3" data-testid="clipboard">
      <Label htmlFor="remote-clipboard" className="text-xs">
        Remote clipboard
      </Label>
      <Textarea
        id="remote-clipboard"
        className="min-h-28 resize-y text-xs"
        aria-label="Clipboard"
        value={text}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          setText(e.target.value)
          clearTimeout(timer.current)
          timer.current = window.setTimeout(() => client.send('clipboard/set', { text: e.target.value }), 500)
        }}
      />
      <p className="text-[10px] leading-4 text-muted-foreground">
        Changes are sent to the remote screen after a short pause.
      </p>
    </PopoverContent>
  )
}
