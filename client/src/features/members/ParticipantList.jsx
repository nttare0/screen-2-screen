import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { CrownIcon, DotsThreeVerticalIcon, ShieldCheckIcon, UsersThreeIcon } from '@phosphor-icons/react'
import { useNeko } from '@/state/provider'
import { useActions } from '@/state/actions'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
export function ParticipantList() {
  const { client } = useNeko()
  const actions = useActions()
  const { sessions, sessionId, hostId } = useStore(
    client.store,
    useShallow((s) => ({ sessions: s.sessions, sessionId: s.session_id, hostId: s.control.host_id })),
  )
  const people = Object.values(sessions).sort((a, b) => {
    if (a.id === sessionId) return -1
    if (b.id === sessionId) return 1
    return Number(b.state.is_connected) - Number(a.state.is_connected)
  })
  const online = people.filter((p) => p.state.is_connected).length
  return (
    <div className="flex min-w-0 flex-1 flex-col" data-testid="participants">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {online} online · {people.length} in this room
        </p>
        <UsersThreeIcon className="size-4 text-muted-foreground" />
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-1 px-3 pb-4">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted/60"
              data-testid="participant-row"
            >
              <div className="relative shrink-0">
                <Avatar seed={person.profile.name} avatar={person.profile.avatar} size={36} />
                <span
                  className={`absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card ${person.state.is_connected ? 'bg-success' : 'bg-muted-foreground'}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium">{person.profile.name}</span>
                  {person.id === sessionId && <span className="text-[10px] text-muted-foreground">you</span>}
                  {person.profile.is_admin && (
                    <ShieldCheckIcon className="size-3.5 shrink-0 text-primary" aria-label="Administrator" />
                  )}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  {person.id === hostId ? (
                    <>
                      <CrownIcon className="size-3 text-primary" /> In control
                    </>
                  ) : person.state.is_connected ? (
                    'Watching'
                  ) : (
                    'Offline'
                  )}
                </p>
              </div>
              {person.id === hostId && (
                <Badge variant="secondary" className="rounded-full px-2 text-[9px]">
                  Host
                </Badge>
              )}
              {person.id !== sessionId && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${person.profile.name}`}
                  onClick={(e) => actions.openMenu(e, person.id)}
                  onContextMenu={(e) => actions.openMenu(e, person.id)}
                >
                  <DotsThreeVerticalIcon className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
      <div className="border-t px-4 py-3 text-[11px] leading-5 text-muted-foreground">
        Open a member’s menu to hand off control or manage permissions.
      </div>
    </div>
  )
}
