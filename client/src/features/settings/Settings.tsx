// Modified for Screen 2 Screen: grouped, labeled preferences using shadcn form controls.
import { useEffect, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { selectIsAdmin } from '@m1k1o/neko'
import { useTranslation } from 'react-i18next'
import { PlayIcon, StopIcon, SignOutIcon, SunIcon, MoonIcon, DesktopIcon } from '@phosphor-icons/react'
import { useActions } from '@/state/actions'
import { useNeko } from '@/state/provider'
import { setSetting } from '@/state/settings'
import { useTheme } from '@/hooks/use-theme'
import { langs, setLang, type Lang } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function Settings() {
  const { t, i18n } = useTranslation()
  const neko = useNeko()
  const { client, app } = neko
  const actions = useActions()
  const { theme, setTheme } = useTheme()
  const {
    settings: s,
    broadcast,
    openInApp,
    keyboardLayouts,
    demo,
  } = useStore(
    app,
    useShallow((a) => ({
      settings: a.settings,
      broadcast: a.broadcast,
      openInApp: a.openInApp,
      keyboardLayouts: a.keyboardLayouts,
      demo: a.demo,
    })),
  )
  const admin = useStore(client.store, selectIsAdmin)
  const [url, setUrl] = useState(broadcast.url)
  useEffect(() => setUrl(broadcast.url), [broadcast.url])

  const toggle = (
    key: 'scroll_invert' | 'autoplay' | 'ignore_emotes' | 'chat_sound' | 'links_in_app',
    name: string,
    description: string,
  ) => (
    <Row title={t(`setting.${name}`)} description={description} id={key}>
      <Switch id={key} checked={s[key]} onCheckedChange={(checked) => setSetting(neko, key, checked)} />
    </Row>
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col" data-testid="settings">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 px-4 py-4 pb-6">
          <section className="space-y-3">
            <SectionTitle>Appearance</SectionTitle>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Color theme">
              {(
                [
                  ['light', SunIcon, 'Light'],
                  ['dark', MoonIcon, 'Dark'],
                  ['system', DesktopIcon, 'System'],
                ] as const
              ).map(([value, Icon, label]) => (
                <Button
                  key={value}
                  variant={theme === value ? 'secondary' : 'outline'}
                  size="sm"
                  aria-pressed={theme === value}
                  className={cn('h-10 gap-1.5 text-xs', theme === value && 'border-primary/40 text-accent-foreground')}
                  onClick={() => setTheme(value)}
                >
                  <Icon className="size-4" /> {label}
                </Button>
              ))}
            </div>
            <Row title="Language" description="Interface language" id="language">
              <Select value={i18n.language} onValueChange={(value) => setLang(value as Lang)}>
                <SelectTrigger
                  id="language"
                  size="sm"
                  className="w-28 text-xs"
                  aria-label="Language"
                  data-testid="lang"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {langs.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </section>
          <Separator />
          <section className="space-y-4">
            <SectionTitle>Playback & room</SectionTitle>
            {toggle('autoplay', 'autoplay', 'Start video when the stream is ready')}
            {toggle('chat_sound', 'chat_sound', 'Play a sound for new messages')}
            {toggle('ignore_emotes', 'ignore_emotes', 'Hide floating reactions')}
            {openInApp && toggle('links_in_app', 'links_in_app', 'Open chat links on the remote screen')}
          </section>
          <Separator />
          <section className="space-y-4">
            <SectionTitle>Input</SectionTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="scroll-sensitivity" className="text-xs">
                  {t('setting.scroll')}
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">{s.scroll_sensitivity}</span>
              </div>
              <Slider
                id="scroll-sensitivity"
                min={-5}
                max={5}
                step={1}
                value={[s.scroll_sensitivity]}
                onValueChange={([value]) => setSetting(neko, 'scroll_sensitivity', value)}
              />
            </div>
            {toggle('scroll_invert', 'scroll_invert', 'Reverse the scroll direction')}
            <Row
              title={t('setting.keyboard_layout')}
              description="Layout sent to the remote screen"
              id="keyboard-layout"
            >
              <Select value={s.keyboard_layout} onValueChange={(value) => setSetting(neko, 'keyboard_layout', value)}>
                <SelectTrigger
                  id="keyboard-layout"
                  size="sm"
                  className="w-28 text-xs"
                  aria-label={t('setting.keyboard_layout')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(keyboardLayouts).length === 0 && (
                    <SelectItem value={s.keyboard_layout}>{s.keyboard_layout.toUpperCase()}</SelectItem>
                  )}
                  {Object.entries(keyboardLayouts).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </section>
          {admin && (
            <>
              <Separator />
              <section className="space-y-3">
                <SectionTitle>{t('setting.broadcast_title')}</SectionTitle>
                <p className="text-[11px] leading-5 text-muted-foreground">
                  Send this room to an RTMP destination. Keep your stream key private.
                </p>
                <Label htmlFor="broadcast-url" className="sr-only">
                  RTMP destination
                </Label>
                <Input
                  id="broadcast-url"
                  type="password"
                  autoComplete="off"
                  className="h-9 text-xs"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={broadcast.active || demo}
                  placeholder="rtmp://…/<stream-key>"
                />
                <Button
                  variant={broadcast.active ? 'destructive' : 'outline'}
                  size="sm"
                  className="w-full"
                  disabled={demo || (!broadcast.active && !url.trim())}
                  onClick={() => (broadcast.active ? actions.broadcastStop() : actions.broadcastStart(url))}
                >
                  {broadcast.active ? <StopIcon className="size-4" /> : <PlayIcon className="size-4" />}
                  {broadcast.active ? 'Stop broadcast' : 'Start broadcast'}
                </Button>
                {demo && (
                  <p className="text-[10px] text-muted-foreground">Broadcasting is available only on a live server.</p>
                )}
              </section>
            </>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-muted-foreground"
          data-testid="logout"
          onClick={actions.logout}
        >
          <SignOutIcon className="size-4" /> {t('logout')}
        </Button>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{children}</h3>
}

function Row({
  title,
  description,
  id,
  children,
}: {
  title: string
  description: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-xs font-medium">
          {title}
        </Label>
        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
