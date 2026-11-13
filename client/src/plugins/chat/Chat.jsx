// Modified for Screen 2 Screen: a compact, accessible chat composer and message timeline.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { useTranslation } from 'react-i18next'
import { ChatCircleDotsIcon, SmileyWinkIcon, PaperPlaneTiltIcon, LockIcon } from '@phosphor-icons/react'
import { useActions } from '@/state/actions'
import { selectMuted } from '@/state/app'
import { useNeko } from '@/state/provider'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { chat } from './store'
import { sendChat } from './actions'
import { loadEmoji } from './emoji'
import { Markdown } from './Markdown'
import { EmojiPicker } from './EmojiPicker'
const time = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const MAX_MESSAGE = 512
export function Chat() {
  const { t } = useTranslation()
  const neko = useNeko()
  const { client } = neko
  const actions = useActions()
  const sessions = useStore(client.store, (s) => s.sessions)
  const muted = useStore(client.store, selectMuted)
  const store = chat(neko)
  const { lines, enabled } = useStore(
    store,
    useShallow((s) => ({ lines: s.lines, enabled: s.enabled })),
  )
  const [text, setText] = useState('')
  const [picker, setPicker] = useState(false)
  const history = useRef(null)
  const input = useRef(null)
  useEffect(() => loadEmoji(store), [store])
  const last = lines[lines.length - 1]?.seq
  useLayoutEffect(() => {
    if (history.current) history.current.scrollTop = history.current.scrollHeight
  }, [last])
  const send = () => {
    if (!text.trim()) return
    sendChat(neko, text)
    setText('')
  }
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    send()
  }
  const onEmoji = (name) => {
    const el = input.current
    const code = `:${name}:`
    const at = el.selectionStart ?? text.length
    const next = (text.slice(0, at) + code + text.slice(el.selectionEnd ?? at)).slice(0, MAX_MESSAGE)
    setText(next)
    setPicker(false)
    el.focus()
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = Math.min(at + code.length, MAX_MESSAGE)
    })
  }
  const nameOf = (m) => sessions[m.id]?.profile.name ?? m.name
  return (
    <div className="flex max-h-full min-w-0 max-w-full flex-1 flex-col overflow-hidden" data-testid="chat">
      <ul
        ref={history}
        tabIndex={0}
        aria-label="Chat messages"
        aria-live="polite"
        className="workspace-scroll min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-4 py-3"
      >
        {lines.length === 0 && (
          <li className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
            <ChatCircleDotsIcon className="size-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">Start the conversation</p>
            <p className="max-w-48 text-xs leading-5 text-muted-foreground">
              Messages are shared with everyone in this room.
            </p>
          </li>
        )}
        {lines.map((m, i) => {
          const bulk = i > 0 && lines[i - 1].id === m.id && lines[i - 1].type === 'text' && m.type === 'text'
          return m.type === 'text' ? (
            <li key={m.seq} className={cn('flex gap-2.5', bulk && '-mt-2')} data-testid="chat-message">
              <div
                className={cn('mt-0.5 shrink-0', bulk && 'invisible')}
                data-testid="chat-author"
                onContextMenu={(e) => actions.openMenu(e, m.id)}
              >
                <Avatar seed={nameOf(m)} avatar={sessions[m.id]?.profile.avatar} size={28} />
              </div>
              <div className="min-w-0 flex-1">
                {!bulk && (
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="truncate text-xs font-semibold">{nameOf(m)}</span>
                    <span
                      className="shrink-0 text-[10px] text-muted-foreground"
                      data-testid="chat-time"
                      title={m.created.toLocaleString()}
                    >
                      {time(m.created)}
                    </span>
                  </div>
                )}
                <div className="text-[13px] leading-5 break-words text-foreground/85 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
                  <Markdown source={m.content} />
                </div>
              </div>
            </li>
          ) : (
            <li
              key={m.seq}
              className="flex items-start gap-2 px-1 text-[10px] leading-4 text-muted-foreground"
              data-testid="chat-event"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
              <span>
                <strong className="font-medium text-foreground/65">{m.name}</strong> {m.content}
              </span>
            </li>
          )
        })}
      </ul>
      {enabled && !muted ? (
        <div className="shrink-0 px-3 pt-1 pb-3">
          <div className="rounded-xl border bg-background p-2 shadow-sm focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/15">
            <Textarea
              ref={input}
              className="max-h-28 min-h-14 resize-none border-0 bg-transparent px-1.5 py-1 text-[13px] leading-5 shadow-none focus-visible:ring-0 dark:bg-transparent"
              data-testid="chat-input"
              placeholder={t('chat:send_a_message')}
              aria-label={t('chat:send_a_message')}
              maxLength={MAX_MESSAGE}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="flex items-center gap-1">
              <Popover open={picker} onOpenChange={setPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Emoji"
                    title="Emoji"
                    data-testid="emoji-open"
                    className="text-muted-foreground"
                  >
                    <SmileyWinkIcon className="size-4" />
                  </Button>
                </PopoverTrigger>
                {picker && <EmojiPicker onPick={onEmoji} onClose={() => input.current?.focus()} />}
              </Popover>
              <span className="hidden text-[9px] text-muted-foreground sm:inline">Enter to send</span>
              <span className="ml-auto mr-1 text-[9px] tabular-nums text-muted-foreground">
                {text.length}/{MAX_MESSAGE}
              </span>
              <Button size="icon-sm" aria-label="Send message" disabled={!text.trim()} onClick={send}>
                <PaperPlaneTiltIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="m-3 flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          <LockIcon className="size-4 shrink-0" />
          {muted ? 'Sending messages is disabled for your account.' : 'Chat is disabled in this room.'}
        </div>
      )}
    </div>
  )
}
