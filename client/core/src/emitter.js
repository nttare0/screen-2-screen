// Minimal typed event emitter (on/off/once/emit).
export class Emitter {
  handlers = new Map()
  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event).add(fn)
    return () => this.off(event, fn)
  }
  off(event, fn) {
    this.handlers.get(event)?.delete(fn)
  }
  once(event, fn) {
    const wrap = (...args) => (this.off(event, wrap), fn(...args))
    return this.on(event, wrap)
  }
  emit(event, ...args) {
    for (const fn of [...(this.handlers.get(event) ?? [])]) fn(...args)
  }
}
