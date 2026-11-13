// Modified for Screen 2 Screen: session context, participants, invitations, and room permissions.
import { useStore } from 'zustand'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { selectIsAdmin } from '@m1k1o/neko'
import {
  SidebarSimpleIcon,
  ShieldCheckIcon,
  CaretDownIcon,
  LockKeyIcon,
  LockKeyOpenIcon,
  MouseIcon,
} from '@phosphor-icons/react'
import { useNeko } from '@/state/provider'
import { useActions } from '@/state/actions'
import { isLocked } from '@/state/app'
import { remember } from '@/state/storage'
import { useSlot } from '@/plugins'
import { BrandMark } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Members } from '@/features/members/Members'
import { InviteButton } from '@/features/room-menu/InviteButton'
import { cn } from '@/lib/utils'

export function Header() {
  const { t } = useTranslation()
  const { client, app } = useNeko()
  const { demo, side } = useStore(
    app,
    useShallow((s) => ({ demo: s.demo, side: s.side })),
  )
  const connection = useStore(client.store, (s) => s.connection.status)
  const admin = useStore(client.store, selectIsAdmin)
  const online = connection === 'connected'

  return (
    <header
      className="flex h-[76px] shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6"
      data-testid="header"
    >
      <BrandMark className="size-8 shrink-0 text-primary md:hidden" />
      <div className="min-w-0">
        <div className="mb-1 hidden items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground sm:flex">
          Workspace <span className="text-border">/</span> Shared browser
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="truncate font-display text-lg font-bold tracking-tight">
            {demo ? 'Studio room' : 'Shared room'}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              'h-5 gap-1.5 rounded-full border-transparent px-2 text-[10px] font-semibold',
              online ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
            )}
          >
            <span className={cn('size-1.5 rounded-full', online ? 'bg-success' : 'bg-warning')} />
            {demo ? 'Preview' : online ? 'Live' : connection === 'connecting' ? 'Connecting' : 'Offline'}
          </Badge>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2.5 lg:flex">
          <Members />
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-xs text-muted-foreground"
            onClick={() => {
              app.setState({ side: true, tab: 'people' })
              remember('side', true)
              remember('tab', 'people')
            }}
          >
            {t('side.people')}
          </Button>
        </div>
        <div className="hidden h-6 w-px bg-border lg:block" />
        {admin && <RoomPermissions />}
        <InviteButton />
        <Button
          variant={side ? 'secondary' : 'ghost'}
          size="icon"
          aria-label="Toggle activity panel"
          aria-expanded={side}
          data-testid="side-toggle"
          onClick={() => {
            app.setState({ side: !side })
            remember('side', !side)
          }}
        >
          <SidebarSimpleIcon className="size-5" />
        </Button>
      </div>
    </header>
  )
}

function RoomPermissions() {
  const { client } = useNeko()
  const actions = useActions()
  const settings = useStore(client.store, (s) => s.settings)
  const items = useSlot('header.item')
  const controlLocked = isLocked('control', settings)
  const loginLocked = isLocked('login', settings)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex gap-1.5 px-2 text-muted-foreground"
          aria-label="Room permissions"
        >
          <ShieldCheckIcon className="size-4 text-primary" />
          <span className="hidden xl:inline">Admin</span>
          <CaretDownIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Room permissions</DropdownMenuLabel>
        <DropdownMenuItem
          data-testid="lock-control"
          data-locked={controlLocked || undefined}
          onSelect={() => actions.toggleLock('control')}
        >
          <MouseIcon className="size-4" />
          {controlLocked ? 'Unlock controls' : 'Lock controls'}
          {controlLocked && <LockKeyIcon className="ml-auto size-3.5 text-warning" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="lock-login"
          data-locked={loginLocked || undefined}
          onSelect={() => actions.toggleLock('login')}
        >
          {loginLocked ? <LockKeyIcon className="size-4" /> : <LockKeyOpenIcon className="size-4" />}
          {loginLocked ? 'Unlock room' : 'Lock room'}
        </DropdownMenuItem>
        {items.length > 0 && <DropdownMenuSeparator />}
        {items.map(({ id, component: Item }) => (
          <Item key={id} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
