import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { selectIsAdmin, selectSession } from '@m1k1o/neko'
import {
  MonitorIcon,
  UsersThreeIcon,
  SlidersHorizontalIcon,
  MoonIcon,
  SunIcon,
  QuestionIcon,
  SignOutIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react'
import { useNeko } from '@/state/provider'
import { useActions } from '@/state/actions'
import { remember } from '@/state/storage'
import { useTheme } from '@/hooks/use-theme'
import { useSlot } from '@/plugins'
import { EachHook } from '@/components/EachHook'
import { BrandMark } from '@/components/Brand'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
const always = () => true
export function NavigationRail() {
  const tabs = useSlot('side.tab')
  return (
    <nav
      aria-label="Workspace navigation"
      className="hidden w-[76px] shrink-0 flex-col items-center border-r bg-sidebar py-5 md:flex"
    >
      <BrandMark className="mb-9 size-10 text-primary" />
      <ScreenButton />
      <div className="my-3 h-px w-8 bg-border" />
      <EachHook items={tabs} use={(tab) => tab.useVisible ?? always}>
        {(visible) => (
          <div className="flex flex-col gap-2">
            {tabs
              .filter((_, i) => visible[i])
              .map((tab) => (
                <TabButton key={tab.id} tab={tab} />
              ))}
          </div>
        )}
      </EachHook>
      <TabButton tab={{ id: 'people', label: 'side.people', icon: UsersThreeIcon, component: () => null }} />
      <TabButton tab={{ id: 'settings', label: 'side.settings', icon: SlidersHorizontalIcon, component: () => null }} />
      <div className="mt-auto flex flex-col items-center gap-2 pt-6">
        <ThemeButton />
        <AboutButton />
        <ProfileButton />
      </div>
    </nav>
  )
}
function RailButton({ label, active, onClick, children, 'data-testid': testId }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={label}
          aria-pressed={active}
          data-testid={testId}
          onClick={onClick}
          className={cn(
            'relative my-1 size-11 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground',
            active && 'bg-accent text-accent-foreground hover:bg-accent',
          )}
        >
          {children}
          {active && <span className="absolute -left-[17px] h-5 w-[3px] rounded-r-full bg-primary" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
function ScreenButton() {
  const { app } = useNeko()
  const side = useStore(app, (s) => s.side)
  return (
    <RailButton
      label="Shared screen"
      active={!side}
      onClick={() => (app.setState({ side: false }), remember('side', false))}
    >
      <MonitorIcon className="size-5" weight="duotone" />
    </RailButton>
  )
}
function TabButton({ tab }) {
  const { t } = useTranslation()
  const { app } = useNeko()
  const { side, activeTab } = useStore(
    app,
    useShallow((s) => ({ side: s.side, activeTab: s.tab })),
  )
  const Icon = tab.icon
  const label = tab.id === 'chat' ? t('chat:tab') : tab.id === 'files' ? t('files:tab') : t(tab.label)
  return (
    <RailButton
      label={label}
      active={side && activeTab === tab.id}
      onClick={() => {
        app.setState({ side: true, tab: tab.id })
        remember('side', true)
        remember('tab', tab.id)
      }}
    >
      <Icon className="size-5" weight="duotone" />
      {tab.id === 'chat' && <UnreadDot />}
    </RailButton>
  )
}
function UnreadDot() {
  const tab = useSlot('side.tab').find((t) => t.id === 'chat')
  const useBadge = tab?.useBadge
  if (!useBadge) return null
  return <BadgeDot useBadge={useBadge} />
}
function BadgeDot({ useBadge }) {
  const count = useBadge()
  const { app } = useNeko()
  const reading = useStore(app, (s) => s.side && s.tab === 'chat')
  const [read, setRead] = useState(count)
  useEffect(() => {
    if (reading) setRead(count)
  }, [reading, count])
  return count > read ? <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" /> : null
}
function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return (
    <RailButton
      label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
    </RailButton>
  )
}
function AboutButton() {
  const { app } = useNeko()
  return (
    <RailButton label="About Screen 2 Screen" onClick={() => app.setState({ about: true })} data-testid="about-open">
      <QuestionIcon className="size-5" />
    </RailButton>
  )
}
function ProfileButton() {
  const { t } = useTranslation()
  const { client, app } = useNeko()
  const actions = useActions()
  const { me, admin } = useStore(
    client.store,
    useShallow((s) => ({ me: selectSession(s), admin: selectIsAdmin(s) })),
  )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label="Your profile" className="mt-2 size-11 rounded-full">
          <Avatar seed={me?.profile.name ?? 'Viewer'} avatar={me?.profile.avatar} size={34} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          {me?.profile.name ?? 'Viewer'}
          {admin && <ShieldCheckIcon className="size-4 text-primary" aria-label="Administrator" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            app.setState({ side: true, tab: 'settings' })
            remember('side', true)
            remember('tab', 'settings')
          }}
        >
          <SlidersHorizontalIcon className="size-4" /> {t('side.settings')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={actions.logout}>
          <SignOutIcon className="size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
