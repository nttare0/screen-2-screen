// Modified for Screen 2 Screen: redesign and connection-adapter integration.
// The GUI's own state next to the core's `client.state`: viewer settings, the side panel, the
// dialog. A zustand store: components select from it (`useStore(app, (s) => s.side)`), everything
// else reads `app.getState()` and writes with `app.setState()`. Plugins keep their own stores.
// Also the bundle one instance of the GUI runs on (`NekoApp`) and the small readers of the
// client's state that components share.
import { createStore } from 'zustand/vanilla'
import { get } from './storage'
import { t } from '@/i18n'
export const defaults = {
  // v3 scroll steps -5..5; new key because the legacy `scroll` (1..100 px clamp) meant something else
  scroll_sensitivity: 0,
  scroll_invert: true,
  autoplay: true,
  ignore_emotes: false,
  chat_sound: true,
  // open chat links on the remote desktop instead of locally (needs the openinapp plugin)
  links_in_app: false,
  keyboard_layout: 'us',
}
function load() {
  const out = { ...defaults }
  for (const k of Object.keys(defaults)) out[k] = get(k, defaults[k])
  return out
}
// one per instance (createNekoApp); what the URL and the stored settings say at start-up
export function createAppStore() {
  const params = new URL(location.href).searchParams
  return createStore(() => ({
    settings: load(),
    side: params.has('show_side') ? params.get('show_side') === '1' : get('side', false),
    // id of the side panel's tab (a plugin's or 'settings')
    tab: get('tab', 'chat'),
    // openinapp/init: links can be opened on the remote desktop
    openInApp: false,
    emotes: {},
    ignored: {},
    broadcast: { active: false, url: '' },
    keyboardLayouts: {},
    menu: null,
    dialog: null,
    about: false,
  }))
}
// one value per instance, made on first use: a plugin's store, the bound actions
export function scoped(create) {
  const cache = new WeakMap()
  return (neko) => {
    if (!cache.has(neko)) cache.set(neko, create(neko))
    return cache.get(neko)
  }
}
export const name = (client, id) => (id && client.state.sessions[id]?.profile.name) || t('somebody')
// the server's chat plugin took this member's right to send (chat.can_send); emotes follow it too
export const selectMuted = (s, id = s.session_id) =>
  !!id && s.sessions[id]?.profile.plugins?.['chat.can_send'] === false
export const isMuted = (client, id) => selectMuted(client.state, id)
export const isLocked = (r, settings) => (r === 'login' ? settings.locked_logins : settings.locked_controls)
