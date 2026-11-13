// In-memory preview adapters. No request in this module reaches a real Neko server.
import {
  ApiError,
  NekoApi,
  type LoginResponse,
  type ScreenSize,
  type Session,
  type Settings,
  type SocketLike,
} from '@m1k1o/neko'
import type { PluginEvents } from '@/plugins/types'

const meId = 'demo-alex'
const profile = (name: string, admin = false) => ({
  name,
  is_admin: admin,
  can_login: true,
  can_connect: true,
  can_watch: true,
  can_host: true,
  can_share_media: false,
  can_access_clipboard: false,
  sends_inactive_cursor: false,
  can_see_inactive_cursors: false,
  plugins: { 'chat.can_send': true },
})
const person = (id: string, name: string, admin = false): Session => ({
  id,
  profile: profile(name, admin),
  state: { is_connected: true, is_watching: true, connected_since: new Date(Date.now() - 12 * 60_000).toISOString() },
})

interface DemoFile {
  name: string
  size: number
  content: string
  url?: string
}

const initialSettings = (): Settings => ({
  private_mode: false,
  locked_logins: false,
  locked_controls: false,
  control_protection: false,
  implicit_hosting: false,
  inactive_cursors: false,
  merciful_reconnect: false,
  plugins: { 'filetransfer.enabled': true },
})

const sizes: ScreenSize[] = [
  { width: 1920, height: 1080, rate: 30 },
  { width: 1600, height: 900, rate: 30 },
  { width: 1280, height: 720, rate: 30 },
]

export class DemoBackend {
  readonly api = new DemoApi(this)
  private authenticated = true
  private socket: DemoSocket | null = null
  private hostId: string | null = null
  private size = sizes[1]
  private settings = initialSettings()
  private sessions: Record<string, Session> = {
    [meId]: person(meId, 'Alex Morgan', true),
    'demo-jamie': person('demo-jamie', 'Jamie Chen'),
    'demo-sam': person('demo-sam', 'Sam Rivera'),
    'demo-riley': person('demo-riley', 'Riley Park'),
  }
  private files = new Map<string, DemoFile>()
  private messages: PluginEvents['chat/message'][] = []

  constructor() {
    const samples = [
      [
        'Project brief.md',
        '# Studio project brief\n\nA shared workspace for the team.\n\n## Goals\n- Review the homepage\n- Align on the visual direction\n- Collect feedback before Friday\n',
      ],
      [
        'Design tokens.json',
        '{\n  "color": { "primary": "#167a55", "surface": "#ffffff" },\n  "radius": { "card": "12px" },\n  "font": { "body": "Inter" }\n}\n',
      ],
      [
        'Research notes.txt',
        'Research notes\n\nParticipants preferred a clear handoff of control and a persistent chat beside the shared screen.\n',
      ],
      [
        'Launch checklist.csv',
        'task,owner,status\nReview homepage,Jamie,In progress\nCheck accessibility,Sam,Done\nPrepare launch notes,Alex,To do\n',
      ],
    ]
    for (const [name, content] of samples)
      this.files.set(name, { name, content, size: new TextEncoder().encode(content).length })
    const now = Date.now()
    this.messages = [
      {
        id: 'demo-jamie',
        created: new Date(now - 4 * 60_000).toISOString(),
        content: { text: 'Morning! I’ve pulled the latest designs into the shared browser.' },
      },
      {
        id: 'demo-sam',
        created: new Date(now - 3 * 60_000).toISOString(),
        content: { text: 'Nice — the new direction feels a lot cleaner.' },
      },
      {
        id: meId,
        created: new Date(now - 2 * 60_000).toISOString(),
        content: { text: 'Let’s review the homepage together. I’ll take control in a moment.' },
      },
      {
        id: 'demo-jamie',
        created: new Date(now - 60_000).toISOString(),
        content: { text: 'Sounds good. I left a few notes in the project brief :pushpin:' },
      },
    ]
  }

  createSocket = (_url: string): SocketLike => {
    this.socket?.close(1000)
    const socket = new DemoSocket(this)
    this.socket = socket
    return socket
  }

  introduce(socket: DemoSocket) {
    socket.emit('system/init', {
      session_id: meId,
      control_host: { has_host: !!this.hostId, host_id: this.hostId ?? undefined },
      screen_size: this.size,
      sessions: this.sessions,
      settings: this.settings,
      touch_events: true,
      screencast_enabled: true,
    })
    socket.emit('system/admin', { screen_sizes_list: sizes, broadcast_status: { is_active: false, url: '' } })
    socket.emit('chat/init', { enabled: true })
    this.emitFiles()
    for (const message of this.messages) socket.emit('chat/message', message)
  }

  detach(socket: DemoSocket) {
    if (this.socket === socket) this.socket = null
  }

  handle(event: string, payload: any) {
    switch (event) {
      case 'control/request':
        if (!this.hostId) this.setHost(meId)
        break
      case 'control/release':
        if (this.hostId === meId) this.setHost(null)
        break
      case 'screen/set':
        this.size = { width: payload.width, height: payload.height, rate: payload.rate }
        this.broadcast('screen/updated', { id: meId, ...this.size })
        break
      case 'clipboard/set':
        this.broadcast('clipboard/updated', { text: String(payload.text ?? '') })
        break
      case 'filetransfer/update':
        this.emitFiles()
        break
      case 'chat/message': {
        const text = String(payload?.text ?? '').slice(0, 512)
        if (!text.trim()) return
        const message = { id: meId, created: new Date().toISOString(), content: { text } }
        this.messages = [...this.messages.slice(-999), message]
        this.broadcast('chat/message', message)
        break
      }
      case 'send/broadcast':
        // The real server does not echo an emote to its sender; the GUI shows it locally.
        break
    }
  }

  async request<T>(method: string, path: string, body?: any): Promise<T> {
    const [pathname, query = ''] = path.split('?')
    if (method === 'GET' && pathname === '/oauth/config') return { enabled: false, password_login_enabled: true } as T
    if (method === 'POST' && pathname === '/login') {
      const name = String(body?.username ?? '').trim()
      if (!name) throw new ApiError(400, 'Enter a display name.')
      if (body?.password !== 'demo') throw new ApiError(401, 'The preview password is demo.')
      this.sessions = {
        ...this.sessions,
        [meId]: { ...this.sessions[meId], profile: { ...this.sessions[meId].profile, name } },
      }
      this.authenticated = true
      return this.sessions[meId] as LoginResponse as T
    }
    if (method === 'POST' && pathname === '/logout') {
      this.authenticated = false
      if (this.hostId === meId) this.hostId = null
      return undefined as T
    }
    if (!this.authenticated) throw new ApiError(401, 'Join the preview first.')
    if (method === 'GET' && pathname === '/whoami') return this.sessions[meId] as T
    if (method === 'POST' && pathname === '/room/settings') {
      const { plugins, ...rest } = body ?? {}
      this.settings = { ...this.settings, ...rest, plugins: { ...this.settings.plugins, ...plugins } }
      this.broadcast('system/settings', { id: meId, ...this.settings })
      return undefined as T
    }
    if (method === 'POST' && pathname.startsWith('/room/control/give/')) {
      const id = decodeURIComponent(pathname.slice('/room/control/give/'.length))
      if (!this.sessions[id]) throw new ApiError(404, 'That member is no longer in the room.')
      this.setHost(id)
      return undefined as T
    }
    if (method === 'POST' && pathname === '/room/control/take') {
      this.setHost(meId)
      return undefined as T
    }
    if (method === 'POST' && pathname === '/room/control/reset') {
      this.setHost(null)
      return undefined as T
    }
    if (method === 'DELETE' && pathname.startsWith('/sessions/')) {
      const id = decodeURIComponent(pathname.slice('/sessions/'.length))
      if (this.sessions[id]?.profile.is_admin)
        throw new ApiError(403, 'Administrators cannot be removed in the preview.')
      const sessions = { ...this.sessions }
      delete sessions[id]
      this.sessions = sessions
      if (this.hostId === id) this.setHost(null)
      this.broadcast('session/deleted', { id })
      return undefined as T
    }
    if (method === 'POST' && pathname.startsWith('/members/')) {
      const id = decodeURIComponent(pathname.slice('/members/'.length))
      const member = this.sessions[id]
      if (!member) throw new ApiError(404, 'Member not found.')
      const updated = {
        ...member,
        profile: { ...member.profile, plugins: { ...member.profile.plugins, ...body?.plugins } },
      }
      this.sessions = { ...this.sessions, [id]: updated }
      this.broadcast('session/profile', { id, ...updated.profile })
      return undefined as T
    }
    if (pathname === '/filetransfer') {
      const name = new URLSearchParams(query).get('filename') ?? ''
      if (method === 'DELETE') {
        this.removeFile(name)
        return undefined as T
      }
      if (method === 'GET') {
        const file = this.files.get(name)
        if (!file) throw new ApiError(404, 'File not found.')
        return undefined as T
      }
    }
    if (pathname.startsWith('/room/broadcast/'))
      throw new ApiError(400, 'Broadcasting is available only on a live server.')
    throw new ApiError(404, `This preview does not implement ${method} ${pathname}.`)
  }

  downloadUrl(path: string) {
    const name = new URLSearchParams(path.split('?')[1] ?? '').get('filename') ?? ''
    const file = this.files.get(name)
    if (!file) throw new ApiError(404, 'File not found.')
    return file.url ?? `data:text/plain;charset=utf-8,${encodeURIComponent(file.content)}`
  }

  blob(path: string) {
    const name = new URLSearchParams(path.split('?')[1] ?? '').get('filename') ?? ''
    const file = this.files.get(name)
    if (!file) throw new ApiError(404, 'File not found.')
    return new Blob([file.content], { type: 'text/plain' })
  }

  addFile(file: File) {
    this.removeFile(file.name)
    this.files.set(file.name, { name: file.name, size: file.size, content: '', url: URL.createObjectURL(file) })
    this.emitFiles()
  }

  private removeFile(name: string) {
    const file = this.files.get(name)
    if (file?.url) URL.revokeObjectURL(file.url)
    this.files.delete(name)
    this.emitFiles()
  }

  private setHost(id: string | null) {
    this.hostId = id
    this.broadcast('control/host', { has_host: !!id, host_id: id ?? undefined, id: meId })
  }

  private emitFiles() {
    const payload: PluginEvents['filetransfer/update'] = {
      enabled: true,
      root_dir: '/studio/shared',
      user_download: true,
      user_upload: true,
      user_delete: true,
      files: [...this.files.values()].map(({ name, size }) => ({ name, size, type: 'file' })),
    }
    this.broadcast('filetransfer/update', payload)
  }

  private broadcast(event: string, payload: unknown) {
    this.socket?.emit(event, payload)
  }
}

class DemoApi extends NekoApi {
  private backend: DemoBackend
  constructor(backend: DemoBackend) {
    super()
    this.backend = backend
  }
  override req<T = void>(method: string, path: string, body?: unknown, _init?: RequestInit): Promise<T> {
    return this.backend.request<T>(method, path, body)
  }
  override downloadUrl(path: string) {
    return this.backend.downloadUrl(path)
  }
  override async blob(path: string) {
    return this.backend.blob(path)
  }
  override async upload(path: string, form: FormData, onProgress?: (p: { loaded: number; total: number }) => void) {
    if (path !== '/filetransfer') throw new ApiError(404, 'Unknown preview upload.')
    for (const entry of form.getAll('files')) {
      if (!(entry instanceof File)) continue
      onProgress?.({ loaded: entry.size, total: entry.size })
      this.backend.addFile(entry)
    }
  }
}

class DemoSocket implements SocketLike {
  readyState = 0
  onmessage: WebSocket['onmessage'] = null
  onclose: WebSocket['onclose'] = null
  private heartbeat = 0
  private backend: DemoBackend

  constructor(backend: DemoBackend) {
    this.backend = backend
    queueMicrotask(() => {
      if (this.readyState === 3) return
      this.readyState = 1
      this.backend.introduce(this)
      this.heartbeat = window.setInterval(() => this.emit('system/heartbeat', {}), 10_000)
    })
  }

  send(data: string) {
    if (this.readyState !== 1) return
    const { event, payload } = JSON.parse(data)
    this.backend.handle(event, payload)
  }

  close(code = 1000) {
    if (this.readyState === 3) return
    this.readyState = 3
    clearInterval(this.heartbeat)
    this.backend.detach(this)
    const event =
      typeof CloseEvent === 'function' ? new CloseEvent('close', { code }) : ({ type: 'close', code } as CloseEvent)
    this.onclose?.call(this as unknown as WebSocket, event)
  }

  emit(event: string, payload: unknown) {
    if (this.readyState !== 1) return
    this.onmessage?.call(
      this as unknown as WebSocket,
      new MessageEvent('message', { data: JSON.stringify({ event, payload }) }),
    )
  }
}
