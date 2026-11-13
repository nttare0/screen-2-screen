// The browser, faked just far enough for the core to load and run under vitest: globals, a few
// elements, a websocket, a peer connection and fetch. Imported first; the core is then imported
// dynamically, after the globals exist. The clock is vitest's (see tick/settle).
import { vi } from 'vitest'
const g = globalThis
// elements: enough of a <video>, <div>, <canvas> and <textarea> for the transport and the overlay
export class FakeElement {
  tag
  children = []
  parent = null
  style = {}
  playsInline = false
  spellcheck = true
  value = ''
  attrs = {}
  paused = true
  playError = null // what play() rejects with, once
  plays = 0 // how often play() was called
  videoWidth = 0
  videoHeight = 0
  offsetWidth = 0
  offsetHeight = 0
  rect = { left: 0, top: 0, width: 0, height: 0 } // what getBoundingClientRect reports
  focused = false
  // a <canvas> context that records what is drawn
  ctx = new Proxy(
    { calls: [] },
    {
      get: (t, k) => (k in t ? t[k] : (...a) => t.calls.push([k, ...a])),
    },
  )
  listeners = new Map()
  _muted = false
  _volume = 1
  _srcObject = null
  constructor(tag) {
    this.tag = tag
  }
  get muted() {
    return this._muted
  }
  set muted(v) {
    this._muted = v
    this.dispatch('volumechange')
  }
  get volume() {
    return this._volume
  }
  set volume(v) {
    this._volume = v
    this.dispatch('volumechange')
  }
  get srcObject() {
    return this._srcObject
  }
  set srcObject(v) {
    const had = this._srcObject
    this._srcObject = v
    if (had && !v) this.dispatch('emptied')
  }
  addEventListener(ev, fn) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, new Set())
    this.listeners.get(ev).add(fn)
  }
  removeEventListener(ev, fn) {
    this.listeners.get(ev)?.delete(fn)
  }
  // one event object for every listener, as the DOM does; a test's fields override the defaults
  dispatch(ev, e = {}) {
    const event = { type: ev, preventDefault() {}, stopPropagation() {}, ...e }
    for (const fn of [...(this.listeners.get(ev) ?? [])]) fn(event)
  }
  get parentElement() {
    return this.parent
  }
  append(...els) {
    for (const el of els) {
      el.parent = this
      this.children.push(el)
    }
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this)
    this.parent = null
  }
  setAttribute(k, v) {
    this.attrs[k] = v
  }
  async play() {
    this.plays++
    if (this.playError) {
      const err = this.playError
      this.playError = null
      throw err
    }
    this.paused = false
    this.dispatch('playing')
  }
  pause() {
    this.paused = true
    this.dispatch('pause')
  }
  getContext() {
    return this.ctx
  }
  getBoundingClientRect() {
    return this.rect
  }
  focus() {
    this.focused = true
  }
  blur() {
    this.focused = false
  }
}
g.window = g
g.location = { href: 'http://neko.test/' }
Object.defineProperty(g, 'navigator', {
  value: { platform: 'Linux', userAgent: 'test', maxTouchPoints: 0 },
  configurable: true,
})
export const storage = new Map()
g.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, v),
  removeItem: (k) => storage.delete(k),
}
g.matchMedia = () => ({ matches: false })
// what the overlay needs: observers and window listeners are recorded so tests can fire and count them
export const resizeObservers = []
g.ResizeObserver = class {
  rec
  constructor(cb) {
    resizeObservers.push((this.rec = { cb, observed: null, disconnected: false }))
  }
  observe(el) {
    this.rec.observed = el
  }
  disconnect() {
    this.rec.disconnected = true
  }
}
g.Image = class {}
g.devicePixelRatio = 1
g.requestAnimationFrame = (fn) => setTimeout(fn, 16)
export const windowListeners = {}
g.addEventListener = (ev, fn) => (windowListeners[ev] ??= new Set()).add(fn)
g.removeEventListener = (ev, fn) => windowListeners[ev]?.delete(fn)
export const documentListeners = {}
g.document = {
  createElement: (tag) => new FakeElement(tag),
  addEventListener: (ev, fn) => (documentListeners[ev] ??= []).push(fn),
  removeEventListener() {},
  hasFocus: () => true,
}
// the clock: timers and Date are fake, setImmediate stays real so promise chains can be drained
vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
// one macrotask turn drains every pending promise chain (the handshake, a fetch)
export const settle = () => new Promise((r) => setImmediate(r))
export const tick = async (ms) => {
  await settle() // whatever is in flight may still schedule a timer
  await vi.advanceTimersByTimeAsync(ms) // fires the due timers in order, settling after each
}
// the network
export const sent = []
export const sentPayloads = []
export const sockets = []
export class FakeSocket {
  static OPEN = 1
  readyState = 1
  url
  closed = false
  code
  onmessage
  onclose
  constructor(url) {
    this.url = url
    sockets.push(this)
  }
  send(data) {
    const m = JSON.parse(data)
    sent.push(m.event)
    sentPayloads.push(m)
  }
  close(code) {
    this.closed = true
    this.code = code
  }
}
g.WebSocket = FakeSocket
export const OFFER =
  'v=0\r\nm=audio 9 RTP/AVP 0\r\na=rtpmap:0 opus/48000\r\nm=video 9 RTP/AVP 96\r\na=rtpmap:96 VP8/90000\r\n'
export const ANSWER = 'v=0\r\nm=audio 9 RTP/AVP 0\r\nm=video 9 RTP/AVP 96\r\n'
export class FakePeer {
  static all = []
  static answerSdp = ANSWER
  config
  connectionState = 'new'
  signalingState = 'stable'
  remoteDescription = null
  localDescription = null
  candidates = []
  senders = []
  closed = false
  onconnectionstatechange
  ontrack
  ondatachannel
  onicecandidate
  onnegotiationneeded
  constructor(config) {
    this.config = config
    FakePeer.all.push(this)
  }
  async setRemoteDescription(d) {
    this.remoteDescription = d
  }
  async createAnswer() {
    return { type: 'answer', sdp: FakePeer.answerSdp }
  }
  async createOffer() {
    return { type: 'offer', sdp: 'local-offer' }
  }
  async setLocalDescription(d) {
    this.localDescription = d
  }
  async addIceCandidate(c) {
    this.candidates.push(c)
  }
  addTrack(track) {
    const sender = { track }
    this.senders.push(sender)
    return sender
  }
  removeTrack(sender) {
    if (!this.senders.includes(sender)) throw new Error('InvalidAccessError')
    this.senders = this.senders.filter((s) => s !== sender)
  }
  getSenders() {
    return this.senders
  }
  close() {
    this.closed = true
  }
  // what the browser's ICE agent would report
  transition(s) {
    this.connectionState = s
    this.onconnectionstatechange?.()
  }
}
g.RTCPeerConnection = FakePeer
export const fetches = []
// what fetch answers; tests replace net.respond
export const net = {
  respond: (_url, _init) => ({ status: 200 }),
}
g.fetch = async (url, init) => {
  fetches.push({ url, init })
  const { status, body } = net.respond(url, init)
  const text = body === undefined ? '' : JSON.stringify(body)
  return {
    ok: status < 300,
    status,
    statusText: 'status ' + status,
    json: async () => JSON.parse(text),
    text: async () => text,
  }
}
// a data channel as the peer would hand it over
export class FakeChannel {
  readyState = 'connecting'
  binaryType = ''
  frames = []
  onmessage
  send(b) {
    this.frames.push([...new Uint8Array(b)])
  }
}
// server payloads
export const profile = (over = {}) => ({
  name: 'Alice',
  is_admin: false,
  can_login: true,
  can_connect: true,
  can_watch: true,
  can_host: true,
  can_share_media: false,
  can_access_clipboard: true,
  sends_inactive_cursor: false,
  can_see_inactive_cursors: false,
  ...over,
})
export const session = (id, over = {}) => ({
  id,
  profile: profile(over),
  state: { is_connected: true, is_watching: false },
})
export const settings = (over = {}) => ({
  private_mode: false,
  locked_logins: false,
  locked_controls: false,
  control_protection: false,
  implicit_hosting: true,
  inactive_cursors: false,
  merciful_reconnect: true,
  ...over,
})
export const init = () => ({
  session_id: 's1',
  sessions: { s1: session('s1'), s2: session('s2', { name: 'Bob' }) },
  settings: settings(),
  screen_size: { width: 1920, height: 1080, rate: 60 },
  control_host: { has_host: true, host_id: 's2' },
  touch_events: true,
})
export const receive = (event, payload, ws = sockets.at(-1)) =>
  ws.onmessage({ data: JSON.stringify({ event, payload }) })
// a clean slate for a test
export const reset = () => {
  sent.length = sentPayloads.length = sockets.length = fetches.length = FakePeer.all.length = 0
  resizeObservers.length = 0
  for (const k of Object.keys(documentListeners)) delete documentListeners[k]
  for (const k of Object.keys(windowListeners)) delete windowListeners[k]
  vi.clearAllTimers()
  storage.clear()
  net.respond = () => ({ status: 200 })
  FakePeer.answerSdp = ANSWER
}
export const patch = (client, key, part) => client.store.setState((s) => ({ ...s, [key]: { ...s[key], ...part } }))
