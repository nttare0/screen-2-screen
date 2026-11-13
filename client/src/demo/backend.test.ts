import { expect, test, vi } from 'vitest'
import { fakeBrowser } from '@/test/browser'

fakeBrowser()
vi.stubGlobal('window', { setInterval: vi.fn(() => 1), clearInterval: vi.fn() })
const { DemoBackend } = await import('./backend')
const { ApiError } = await import('@m1k1o/neko')

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

test('preview REST adapter authenticates locally and never requires a server', async () => {
  const backend = new DemoBackend()
  const me = await backend.request<any>('GET', '/whoami')
  expect(me.profile.name).toBe('Alex Morgan')
  expect(me.profile.is_admin).toBe(true)
  await expect(backend.request('POST', '/login', { username: 'Alex', password: 'wrong' })).rejects.toMatchObject({
    status: 401,
  })
  await backend.request('POST', '/login', { username: 'Taylor', password: 'demo' })
  expect((await backend.request<any>('GET', '/whoami')).profile.name).toBe('Taylor')
  await backend.request('POST', '/logout')
  await expect(backend.request('GET', '/whoami')).rejects.toBeInstanceOf(ApiError)
})

test('preview socket speaks the room protocol for settings, control, and chat', async () => {
  const backend = new DemoBackend()
  const socket = backend.createSocket('ws://preview.invalid/api/ws')
  const events: { event: string; payload: any }[] = []
  socket.onmessage = (message) => events.push(JSON.parse(String(message.data)))
  await flush()
  expect(events.some((e) => e.event === 'system/init')).toBe(true)
  expect(events.some((e) => e.event === 'filetransfer/update')).toBe(true)
  await backend.request('POST', '/room/settings', { plugins: { 'filetransfer.enabled': false } })
  expect(events.at(-1)).toMatchObject({
    event: 'system/settings',
    payload: { plugins: { 'filetransfer.enabled': false } },
  })
  backend.handle('control/request', undefined)
  expect(events.at(-1)).toMatchObject({ event: 'control/host', payload: { has_host: true, host_id: 'demo-alex' } })
  backend.handle('chat/message', { text: 'hello from the preview' })
  expect(events.at(-1)).toMatchObject({
    event: 'chat/message',
    payload: { content: { text: 'hello from the preview' } },
  })
  socket.close?.(1000)
})

test('preview downloads are local data URLs and unknown endpoints fail explicitly', async () => {
  const backend = new DemoBackend()
  const url = backend.downloadUrl('/filetransfer?filename=Project%20brief.md')
  expect(url.startsWith('data:text/plain')).toBe(true)
  expect(decodeURIComponent(url)).toContain('# Studio project brief')
  await expect(backend.request('POST', '/room/broadcast/start', { url: 'rtmp://example' })).rejects.toMatchObject({
    status: 400,
  })
  await expect(backend.request('GET', '/not-implemented')).rejects.toMatchObject({ status: 404 })
})
