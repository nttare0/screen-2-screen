import { createStore } from 'zustand/vanilla'
import { scoped } from '@/state/app'
export const createChatStore = () =>
  createStore(() => ({
    lines: [],
    // messages received, for the unread badge
    texts: 0,
    // chat/init: the server's chat plugin is on
    enabled: true,
    emojiReady: false,
    emojiRecent: [],
  }))
// the store of an instance (`chat(neko)`, `chat(useNeko())`)
export const chat = scoped(createChatStore)
// chat keeps the last CHAT_LIMIT lines in memory; nothing is persisted
const CHAT_LIMIT = 1000
let seq = 0
export function push(store, line) {
  store.setState((s) => ({ lines: [...s.lines, { ...line, seq: ++seq }].slice(-CHAT_LIMIT) }))
}
