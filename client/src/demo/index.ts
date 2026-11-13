import { createNekoApp } from '@/state/neko'
import type { NekoApp } from '@/state/app'
import { DemoBackend } from './backend'
import { DemoTransport } from './transport'

export function createDemoApp(): NekoApp {
  const backend = new DemoBackend()
  const neko = createNekoApp({
    api: backend.api,
    socket: backend.createSocket,
    transport: new DemoTransport(),
    autologin: false,
  })
  neko.app.setState((state) => ({
    demo: true,
    side: window.matchMedia('(min-width: 1100px)').matches,
    tab: 'chat',
    settings: { ...state.settings, chat_sound: false },
  }))
  return neko
}
