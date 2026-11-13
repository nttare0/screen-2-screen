// Modified for Screen 2 Screen: an immersive screen surface with contextual transport controls.
import { useRef } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { selectControlling, selectIsAdmin, selectSession } from '@m1k1o/neko'
import { useTranslation } from 'react-i18next'
import {
  ArrowsOutIcon,
  ClipboardIcon,
  KeyboardIcon,
  MonitorIcon,
  MouseIcon,
  PictureInPictureIcon,
  PlayIcon,
  SpeakerHighIcon,
  CircleNotchIcon,
  CaretDownIcon,
  VideoCameraSlashIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useActions } from '@/state/actions'
import { useNeko } from '@/state/provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Emote } from '@/features/emotes/Emote'
import { Resolution } from './Resolution'
import { Clipboard } from './Clipboard'
import { Player } from './Player'
import { useFullscreen } from './useFullscreen'
import { useClipboardSync, canReadClipboard } from './useClipboardSync'
import { usePip } from './usePip'

export function Stage({ hideControls, extraControls }: { hideControls: boolean; extraControls: boolean }) {
  const { t } = useTranslation()
  const { client, overlay, app } = useNeko()
  const actions = useActions()
  const {
    admin,
    hosting,
    hostId,
    implicit,
    lockedControls,
    video,
    screen,
    configurations,
    status,
    sessions,
    canWatch,
  } = useStore(
    client.store,
    useShallow((s) => ({
      admin: selectIsAdmin(s),
      hosting: selectControlling(s),
      hostId: s.control.host_id,
      implicit: s.settings.implicit_hosting,
      lockedControls: s.settings.locked_controls,
      video: s.video,
      screen: s.screen.size,
      configurations: s.screen.configurations,
      status: s.connection.status,
      sessions: s.sessions,
      canWatch: selectSession(s)?.profile.can_watch !== false,
    })),
  )
  const { emotes, demo } = useStore(
    app,
    useShallow((s) => ({ emotes: s.emotes, demo: s.demo })),
  )
  const player = useRef<HTMLDivElement>(null)
  const { fullscreen, request: requestFullscreen } = useFullscreen(player)
  const syncClipboard = useClipboardSync()
  const pip = usePip()
  const controlLocked = lockedControls && !admin
  const { playing, playable, muted, mutedByAutoplay } = video
  const hostName = hostId ? sessions[hostId]?.profile.name : null

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden',
        !hideControls && 'rounded-xl border bg-card shadow-sm',
      )}
    >
      {!hideControls && (
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <MonitorIcon className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold">Shared screen</h2>
          <Badge variant="secondary" className="ml-1 h-5 rounded px-1.5 text-[9px] font-medium">
            {demo ? 'DEMO' : 'ROOM 01'}
          </Badge>
          <div className="ml-auto flex items-center gap-1">
            {admin && configurations.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground"
                    data-testid="resolution-open"
                  >
                    {screen.width} × {screen.height}
                    <CaretDownIcon className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <Resolution />
              </DropdownMenu>
            ) : (
              <span className="hidden text-[11px] tabular-nums text-muted-foreground sm:inline">
                {screen.width} × {screen.height}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fullscreen"
              title="Fullscreen"
              onClick={requestFullscreen}
            >
              <ArrowsOutIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
      <div ref={player} className="relative min-h-0 flex-1 bg-stage">
        <div className="absolute inset-0" data-testid="player" onMouseEnter={syncClipboard}>
          <Player transport={client.transport} />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Object.entries(emotes).map(([id, type]) => (
              <Emote key={id} id={id} type={type} />
            ))}
          </div>
          {!playing && playable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Button
                size="icon-lg"
                className="size-16 rounded-full shadow-xl"
                aria-label="Play"
                data-testid="player-overlay"
                onClick={() => {
                  client.unmute()
                  client.play().catch(() => {})
                }}
              >
                <PlayIcon className="size-7" weight="fill" />
              </Button>
            </div>
          )}
          {playing && muted && mutedByAutoplay && (
            <div className="absolute inset-x-0 bottom-5 flex justify-center">
              <Button
                size="sm"
                className="gap-2 rounded-full shadow-lg"
                data-testid="player-overlay"
                onClick={() => client.unmute()}
              >
                <SpeakerHighIcon className="size-4" /> Click to unmute
              </Button>
            </div>
          )}
          {status !== 'disconnected' && !playable && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stage px-6 text-center">
              {status === 'connecting' ? (
                <CircleNotchIcon className="size-7 animate-spin text-primary" />
              ) : (
                <VideoCameraSlashIcon className="size-8 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">
                {status === 'connecting'
                  ? 'Connecting to the shared screen'
                  : canWatch
                    ? 'Waiting for the stream'
                    : 'Video is not available for your account'}
              </p>
              <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                {status === 'connecting'
                  ? 'Setting up the room and media connection.'
                  : canWatch
                    ? 'The room is connected. Video will appear when the server sends a track.'
                    : 'You can still use chat and the other room features.'}
              </p>
            </div>
          )}
        </div>
        {!fullscreen && !hideControls && (
          <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
            {extraControls && !controlLocked && !implicit && (
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={hosting ? t('controls.release') : t('controls.request')}
                title={hosting ? t('controls.release') : t('controls.request')}
                onClick={() => playable && actions.toggleControl()}
              >
                <MouseIcon className="size-4" />
              </Button>
            )}
            {hosting && !canReadClipboard && (
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    aria-label="Clipboard"
                    title="Clipboard"
                    data-testid="clipboard-open"
                  >
                    <ClipboardIcon className="size-4" />
                  </Button>
                </PopoverTrigger>
                <Clipboard />
              </Popover>
            )}
            {pip.canPip && (
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Picture-in-Picture"
                title="Picture-in-Picture"
                onClick={pip.request}
              >
                <PictureInPictureIcon className="size-4" />
              </Button>
            )}
            {hosting && client.isTouchDevice && (
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Keyboard"
                title="Keyboard"
                data-testid="keyboard-toggle"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => overlay.mobileKeyboardToggle()}
              >
                <KeyboardIcon className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      {!hideControls && (
        <div className="flex min-h-9 shrink-0 items-center gap-2 border-t px-4 py-2 text-[11px] text-muted-foreground">
          <MouseIcon className={cn('size-3.5 shrink-0', hosting && 'text-primary')} />
          <span className="truncate">
            {hosting
              ? 'You’re in control. Your keyboard and mouse are shared.'
              : hostName
                ? `${hostName} is controlling the screen.`
                : 'View-only mode. Request control to interact.'}
          </span>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 sm:flex">
            <span className={cn('size-1.5 rounded-full', status === 'connected' ? 'bg-success' : 'bg-warning')} />
            {demo ? 'Local preview' : 'WebRTC'} · {screen.rate} fps
          </span>
        </div>
      )}
    </div>
  )
}
