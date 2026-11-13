// Modified for Screen 2 Screen: reactions tucked into the shared control dock.
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { useActions } from '@/state/actions'
import { selectMuted } from '@/state/app'
import { EMOTES } from '@/state/emotes'
import { useClient } from '@/state/provider'
import { SmileyStickerIcon } from '@phosphor-icons/react'
import { IconButton } from '@/components/IconButton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import './sprites.css'

export function Emotes() {
  const client = useClient()
  const actions = useActions()
  const muted = useStore(client.store, selectMuted)
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('emote_recent') || '[]')
    } catch {
      return []
    }
  })
  const repeat = useRef(0)
  const pick = (emote: string) => {
    if (!recent.includes(emote)) {
      const next = [...recent.slice(-2), emote]
      setRecent(next)
      try {
        localStorage.setItem('emote_recent', JSON.stringify(next))
      } catch {}
    }
    actions.sendEmote(emote)
  }
  const stop = () => clearInterval(repeat.current)
  useEffect(() => stop, [])
  const start = (emote: string) => {
    actions.sendEmote(emote)
    stop()
    repeat.current = window.setInterval(() => actions.sendEmote(emote), 350)
  }
  if (muted) return null
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={stop} onMouseUp={stop}>
      {recent.map((e) => (
        <IconButton
          key={e}
          label={e}
          className={`emote hidden size-8 text-[22px] sm:inline-flex ${e}`}
          onClick={(ev) => ev.detail === 0 && actions.sendEmote(e)}
          onMouseDown={(ev) => (ev.preventDefault(), start(e))}
        />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton label="Emotes" className="size-8" data-testid="emotes-open">
            <SmileyStickerIcon className="size-4" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="grid w-56 grid-cols-5 gap-1 p-2"
          side="top"
          align="end"
          data-testid="emotes-menu"
        >
          {EMOTES.map((e) => (
            <DropdownMenuItem
              key={e}
              className="justify-center p-1.5"
              aria-label={e}
              title={e}
              onSelect={() => pick(e)}
            >
              <div className={`emote ${e}`} data-emote={e} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
