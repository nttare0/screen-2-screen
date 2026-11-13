class FakeElement {
  style = {}
  spellcheck = true
  children = []
  onload = null
  setAttribute() {}
  append(...nodes) {
    this.children.push(...nodes)
  }
  addEventListener() {}
  removeEventListener() {}
  getContext() {
    return {}
  }
}
const fake = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
// returns what localStorage holds
export function fakeBrowser(href = 'http://neko.test/') {
  const stored = new Map()
  fake('location', { href })
  fake('localStorage', {
    getItem: (k) => stored.get(k) ?? null,
    setItem: (k, v) => stored.set(k, String(v)),
    removeItem: (k) => stored.delete(k),
  })
  fake('document', { createElement: () => new FakeElement(), visibilityState: 'visible' })
  fake('Image', FakeElement)
  fake(
    'Audio',
    class {
      play = () => Promise.resolve()
    },
  )
  return stored
}
// a transport that records the volume it is given
export function fakeTransport() {
  const handlers = new Map()
  return {
    kind: 'webrtc',
    element: null,
    volume: 1,
    connect: async () => {},
    close() {},
    attach: () => () => {},
    setPlaying: async () => {},
    setVolume(v) {
      this.volume = v
    },
    setMuted() {},
    on(event, cb) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event).add(cb)
      return () => void handlers.get(event).delete(cb)
    },
  }
}
