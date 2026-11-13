// Modified for Screen 2 Screen: accessible shadcn controls over the unchanged input/media actions.
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { selectControlling, selectIsAdmin, selectSession } from '@m1k1o/neko'
import { useTranslation } from 'react-i18next'
import {
  CursorIcon,
  KeyboardIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useActions } from '@/state/actions'
import { tell } from '@/state/dialogs'
import { useNeko } from '@/state/provider'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function Controls() {
  const { t } = useTranslation()
  const { client, app } = useNeko()
  const actions = useActions()
  const { admin, hosting, hosted, implicit, lockedControls, localLock, video, connected, canShareMedia } = useStore(
    client.store,
    useShallow((s) => ({
      admin: selectIsAdmin(s),
      hosting: selectControlling(s),
      hosted: s.control.host_id !== null,
      implicit: s.settings.implicit_hosting,
      lockedControls: s.settings.locked_controls,
      localLock: s.control.locked,
      video: s.video,
      connected: s.connection.status === 'connected',
      canShareMedia: !!selectSession(s)?.profile.can_share_media,
    })),
  )
  const [shake, setShake] = useState(false)
  const mic = useRef<{ track: MediaStreamTrack; stop: () => void } | null>(null)
  const [micOn, setMicOn] = useState(false)

  const controlLocked = lockedControls && !admin
  const locked = localLock && hosting
  const { playable, playing, muted, volume } = video
  const micAllowed = hosting && canShareMedia && !!navigator.mediaDevices
  const lockDisabled = !hosting || (implicit && controlLocked)

  useEffect(() => {
    let timer = 0
    const hint = () => {
      if (client.controlling || client.state.settings.implicit_hosting) return
      setShake(true)
      clearTimeout(timer)
      timer = window.setTimeout(() => setShake(false), 1200)
    }
    const off = client.events.on('overlay.click', hint)
    return () => {
      off()
      clearTimeout(timer)
    }
  }, [client])

  const micOff = () => {
    if (!mic.current) return
    mic.current.stop()
    mic.current.track.stop()
    mic.current = null
    setMicOn(false)
  }

  useEffect(() => {
    if (!micAllowed || !connected) micOff()
  }, [micAllowed, connected])

  const toggleMic = async () => {
    if (mic.current) return micOff()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const track = stream.getAudioTracks()[0]
      mic.current = { track, stop: client.shareMedia(stream) }
      setMicOn(true)
    } catch (err: any) {
      tell(app, t('controls.mic_error'), err.message)
    }
  }

  return (
    <div role="toolbar" aria-label="Screen controls" className="flex flex-wrap items-center gap-1.5">
      {!implicit && (!controlLocked || hosting) && (
        <Button
          variant={hosting ? 'secondary' : 'default'}
          size="sm"
          className={cn('h-9 gap-2 px-3.5', shake && !hosting && 'animate-shake')}
          disabled={!playable}
          data-testid="control-request"
          onClick={actions.toggleControl}
        >
          <KeyboardIcon className="size-4" />
          <span>{hosting ? t('controls.release') : t('controls.request')}</span>
        </Button>
      )}
      {implicit && (
        <Badge variant="secondary" className="h-9 gap-1.5 px-3" data-testid="control-implicit">
          <CursorIcon className="size-4" /> Interactive mode
        </Badge>
      )}
      {(implicit || !controlLocked || hosting) && (
        <div
          className="mx-1 hidden items-center gap-2 sm:flex"
          title={hosting ? t(locked ? 'controls.unlock' : 'controls.lock') : 'Take control to lock your input'}
        >
          <Switch
            id="input-lock"
            size="sm"
            checked={!locked}
            disabled={lockDisabled}
            onCheckedChange={(checked) => (checked ? client.unlock() : client.lock())}
            aria-label={locked ? 'Unlock your input' : 'Lock your input'}
          />
          <Label htmlFor="input-lock" className="text-[11px] font-normal text-muted-foreground">
            Input
          </Label>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={playing ? 'Pause' : 'Play'}
        title={playing ? 'Pause' : 'Play'}
        disabled={!playable}
        onClick={() => (playing ? client.pause() : client.play().catch(() => {}))}
      >
        {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
      </Button>
      {micAllowed && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t(micOn ? 'controls.mic_off' : 'controls.mic_on')}
          title={t(micOn ? 'controls.mic_off' : 'controls.mic_on')}
          data-testid="mic"
          data-on={micOn || undefined}
          onClick={toggleMic}
        >
          {micOn ? <MicrophoneIcon className="size-4" /> : <MicrophoneSlashIcon className="size-4" />}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={muted ? 'Unmute' : 'Mute'}
        title={muted ? 'Unmute' : 'Mute'}
        data-testid="mute"
        onClick={() => (muted ? client.unmute() : client.mute())}
      >
        {volume === 0 || muted ? <SpeakerSlashIcon className="size-4" /> : <SpeakerHighIcon className="size-4" />}
      </Button>
      <Slider
        className="mx-1 hidden w-20 sm:flex"
        min={0}
        max={100}
        step={1}
        aria-label="Volume"
        value={[Math.round(volume * 100)]}
        onValueChange={([value]) => client.setVolume(value / 100)}
      />
      {hosted && !hosting && !implicit && <span className="sr-only">Another participant currently has control.</span>}
    </div>
  )
}
