// Modified for Screen 2 Screen: a compact participant stack with the existing member actions.
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { selectSession } from '@m1k1o/neko'
import { CrownIcon, ShieldCheckIcon } from '@phosphor-icons/react'
import { useNeko } from '@/state/provider'
import { useActions } from '@/state/actions'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
const menuKey = ({ client, app }, e, id) => {
  if (e.key !== 'ContextMenu' && !(e.shiftKey && e.key === 'F10')) return
  e.preventDefault()
  e.stopPropagation()
  const r = e.currentTarget.getBoundingClientRect()
  if (id !== client.state.session_id) app.setState({ menu: { x: r.left, y: r.bottom, id } })
}
export function Members() {
  const neko = useNeko()
  const { client } = neko
  const actions = useActions()
  const { me, hostId, sessions, sessionId } = useStore(
    client.store,
    useShallow((s) => ({
      me: selectSession(s),
      hostId: s.control.host_id,
      sessions: s.sessions,
      sessionId: s.session_id,
    })),
  )
  const others = Object.values(sessions).filter((m) => m.id !== sessionId && m.state.is_connected)
  const visible = [...(me ? [me] : []), ...others].slice(0, 4)
  const total = (me ? 1 : 0) + others.length
  return (
    <div className="flex items-center -space-x-2" aria-label={`${total} people in the room`}>
      {visible.map((m) => (
        <Button
          key={m.id}
          variant="ghost"
          size="icon-sm"
          className="relative size-8 rounded-full ring-2 ring-background hover:z-10"
          data-testid="member"
          data-self={m.id === sessionId || undefined}
          data-host={m.id === hostId || undefined}
          aria-label={m.id === sessionId ? `${m.profile.name} (you)` : m.profile.name}
          title={m.id === sessionId ? `${m.profile.name} (you)` : m.profile.name}
          onClick={(e) => m.id !== sessionId && actions.openMenu(e, m.id)}
          onKeyDown={(e) => menuKey(neko, e, m.id)}
        >
          <Avatar seed={m.profile.name} avatar={m.profile.avatar} size={30} />
          {m.profile.is_admin && (
            <span
              className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-secondary text-primary ring-1 ring-background"
              data-testid={m.id === sessionId ? 'admin-badge' : undefined}
              title="Administrator"
            >
              <ShieldCheckIcon className="size-2.5" />
            </span>
          )}
          {m.id === hostId && (
            <span className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CrownIcon className="size-2.5" />
            </span>
          )}
        </Button>
      ))}
      {total > 4 && (
        <span className="z-10 flex size-8 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold ring-2 ring-background">
          +{total - 4}
        </span>
      )}
    </div>
  )
}
