import { scoped } from '@/state/app'
import { api } from '@/state/api'
export function sendChat({ client }, text) {
  client.send('chat/message', { text })
}
// who toggled a member's chat permission, when it was us (the server does not say)
export const mutedByMe = scoped(() => new Set())
export function mute(neko, id, muted) {
  mutedByMe(neko).add(id)
  return api(neko, 'POST', `/members/${encodeURIComponent(id)}`, { plugins: { 'chat.can_send': !muted } })
}
export const openInApp = (neko, url) => api(neko, 'POST', '/openinapp/openlink', { text: url })
