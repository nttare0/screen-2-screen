// The keyboard/mouse/touch control device: an input layer over the stream (mouse, wheel, keyboard,
// touch, file drop) that sends through `client.input`, and the host's cursor drawn for everyone
// who is not controlling. Attached by the consumer next to the transport's element (see attach);
// the client itself knows nothing of it, so a stream-only consumer never loads it or the keyboard.
import GuacamoleKeyboard from './keyboard/guacamole.js'
import { selectControlling } from './client.js'
const WHEEL_STEP = 53 // px of wheel delta per scroll step
const WHEEL_LINE_HEIGHT = 19 // px per line when the browser reports lines
const MOVE_THROTTLE_MS = 1000 / 60
const LAYER = 'position:absolute;inset:0;width:100%;height:100%;'
// X11 keysyms
const XK = {
  v: 0x0076,
  Control_L: 0xffe3,
  Control_R: 0xffe4,
  Meta_L: 0xffe7,
  Alt_L: 0xffe9,
  Alt_R: 0xffea,
  Super_L: 0xffeb,
  Super_R: 0xffec,
  Mode_switch: 0xff7e,
  ISO_Level3_Shift: 0xfe03,
}
// macOS: Cmd acts as Ctrl and Option as AltGr on the remote (same as noVNC / the legacy client)
const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
const MAC_REMAP = {
  [XK.Meta_L]: XK.Control_L,
  [XK.Super_L]: XK.Alt_L,
  [XK.Super_R]: XK.Super_L,
  [XK.Alt_L]: XK.Mode_switch,
  [XK.Alt_R]: XK.ISO_Level3_Shift,
}
const remap = (key) => (isMac && MAC_REMAP[key]) || key
const isCtrl = (key) => key === XK.Control_L || key === XK.Control_R
const TOUCH_PHASE = {
  touchstart: 'begin',
  touchmove: 'update',
  touchend: 'end',
  touchcancel: 'end',
}
export class Overlay {
  wrap = document.createElement('div')
  canvas = document.createElement('canvas')
  ctx = this.canvas.getContext('2d')
  input = document.createElement('textarea')
  keyboard = new GuacamoleKeyboard()
  cleanup = []
  box = null
  size = { width: 0, height: 0 } // of the box, in CSS px
  cursor = null
  cursorImg = new Image()
  cursorPos = null
  drawQueued = false
  wheel = { x: 0, y: 0, t: 0 }
  lastMove = 0
  moveTimer = 0
  mouseDown = false
  pendingPress = null // implicit hosting: replayed once we are host
  ctrlDown = 0
  noKeyUp = new Set()
  client
  constructor(client) {
    this.client = client
    this.canvas.style.cssText = LAYER
    // a transparent textarea receives keys, IME composition and the mobile keyboard
    this.input.style.cssText =
      LAYER +
      'font-size:16px;resize:none;caret-color:transparent;outline:0;border:0;color:transparent;background:transparent;'
    this.input.spellcheck = false
    this.input.setAttribute('autocapitalize', 'off')
    this.input.setAttribute('autocomplete', 'off')
    this.input.setAttribute('data-gramm', 'false')
    this.wrap.append(this.canvas, this.input)
    this.keyboard.onkeydown = (key) => this.onKeyDown(remap(key))
    this.keyboard.onkeyup = (key) => this.onKeyUp(remap(key))
    this.keyboard.listenTo(this.input)
    this.cursorImg.onload = this.draw
  }
  // `box` is a positioned element that already holds the transport's element (so the stream is
  // below): the overlay fills it, and keeps it letterboxed inside its parent to the remote screen's
  // aspect ratio so that its canvas maps onto the picture (a stream alone needs no letterboxing, the
  // <video> keeps the aspect ratio by itself). Returns what detaches it again; a second attach
  // replaces the first.
  attach(box) {
    this.detach()
    this.box = box
    box.append(this.wrap)
    const { client, input } = this
    const on = (el, ev, fn, opts) => {
      el.addEventListener(ev, fn, opts)
      this.cleanup.push(() => el.removeEventListener(ev, fn, opts))
    }
    const stop = (fn) => (e) => {
      e.preventDefault()
      e.stopPropagation()
      fn(e)
    }
    on(
      input,
      'click',
      stop((e) => client.events.emit('overlay.click', e)),
    )
    on(
      input,
      'contextmenu',
      stop(() => {}),
    )
    on(
      input,
      'wheel',
      stop((e) => this.onWheel(e)),
      { passive: false },
    )
    on(
      input,
      'mousemove',
      stop((e) => this.onMove(e)),
    )
    on(
      input,
      'mousedown',
      stop((e) => this.onButton(e, true)),
    )
    // mouseup anywhere: the button may be released outside the video
    on(window, 'mouseup', (e) => this.onButton(e, false), { capture: true })
    on(input, 'mouseenter', (e) => this.onEnter(e))
    on(input, 'mouseleave', () => {
      this.hovering = false
      this.keyboard.reset()
    })
    for (const ev of Object.keys(TOUCH_PHASE)) on(input, ev, (e) => this.onTouch(e), { passive: false })
    on(
      input,
      'dragover',
      stop((e) => this.onMove(e)),
    )
    on(
      input,
      'drop',
      stop((e) => this.onDrop(e)),
    )
    // text that arrives as input or composition events (IME, on-screen keyboards) is typed as
    // key events by the Guacamole keyboard; the textarea only has to be emptied afterwards
    on(input, 'input', (e) => !e.isComposing && (this.input.value = ''))
    on(input, 'compositionend', () => (this.input.value = ''))
    on(
      input,
      'paste',
      stop((e) => this.onPaste(e.clipboardData?.getData('text/plain') ?? '')),
    )
    on(input, 'blur', () => client.store.setState({ mobile_keyboard_open: false }))
    // the box follows its parent and the remote screen
    const observer = new ResizeObserver(() => this.onResize())
    if (box.parentElement) observer.observe(box.parentElement)
    this.cleanup.push(
      () => observer.disconnect(),
      client.store.subscribe(
        (s) => s.screen.size,
        () => this.onResize(),
      ),
      client.store.subscribe(
        () => this.visible,
        () => this.sync(),
      ),
      client.store.subscribe(
        () => this.interactive,
        () => this.sync(),
      ),
      client.store.subscribe(selectControlling, (c) => this.onControl(c)),
      client.store.subscribe((s) => s.control.host_id, this.draw),
      client.store.subscribe(
        () => this.active,
        () => this.focusIfActive(),
      ),
      client.transport.on('cursor.position', (p) => (p ? this.onCursorPosition(p) : this.clearCursor())),
      client.transport.on('cursor.image', (img) => this.onCursorImage(img)),
    )
    this.sync()
    this.onResize()
    return () => this.detach()
  }
  detach() {
    if (!this.box) return
    clearTimeout(this.moveTimer)
    this.cleanup.splice(0).forEach((fn) => fn())
    this.keyboard.reset()
    this.wrap.remove()
    this.box = null
  }
  // shown unless the room is private (to non-admins) or there is no connection; takes the mouse
  // only while this member may host and has not locked themselves out
  get visible() {
    return !this.client.privateModeEnabled && this.client.state.connection.status !== 'disconnected'
  }
  get interactive() {
    return !this.client.state.control.locked && !!this.client.session?.profile.can_host
  }
  sync() {
    this.wrap.style.display = this.visible ? '' : 'none'
    this.wrap.style.pointerEvents = this.interactive ? 'auto' : 'none'
  }
  // letterbox the box to the remote screen's aspect ratio inside its parent
  onResize() {
    const area = this.box?.parentElement
    if (!this.box || !area) return
    const { width, height } = this.client.state.screen.size
    const { offsetWidth: W, offsetHeight: H } = area
    const w = Math.min(W, (H * width) / height)
    const h = Math.min(H, (W * height) / width)
    Object.assign(this.box.style, {
      width: `${w}px`,
      height: `${h}px`,
      marginTop: `${(H - h) / 2}px`,
      marginLeft: `${(W - w) / 2}px`,
    })
    this.size = { width: w, height: h }
    this.resize()
  }
  // input only flows while we are host and have not locked ourselves out
  get active() {
    return this.client.controlling && !this.client.state.control.locked
  }
  pos(e) {
    const r = this.canvas.getBoundingClientRect()
    const { width, height } = this.client.state.screen.size
    const clamp = (v, max) => Math.max(0, Math.min(Math.round(v), max))
    return {
      x: clamp((width / r.width) * (e.clientX - r.left), width),
      y: clamp((height / r.height) * (e.clientY - r.top), height),
    }
  }
  move(p) {
    this.client.input.move(p.x, p.y)
  }
  button(code, down) {
    this.client.input.button(code, down)
  }
  /////////////////////////////
  // mouse
  /////////////////////////////
  // throttled to MOVE_THROTTLE_MS, but the last position always goes out (trailing send),
  // otherwise the remote pointer stops short of where the local one came to rest
  onMove(e) {
    if (!this.active) return
    const pos = this.pos(e)
    clearTimeout(this.moveTimer)
    const wait = MOVE_THROTTLE_MS - (performance.now() - this.lastMove)
    if (wait <= 0) return this.sendMove(pos)
    this.moveTimer = window.setTimeout(() => this.sendMove(pos), wait)
  }
  sendMove(pos) {
    this.lastMove = performance.now()
    if (this.active) this.move(pos)
  }
  onButton(e, down) {
    if (down) this.mouseDown = true
    else if (!this.mouseDown)
      return // only releases of presses that started on the video
    else this.mouseDown = false
    if (!this.client.controlling) {
      if (down && this.client.implicitControl) {
        this.pendingPress = { e, at: performance.now() }
        this.client.request()
      }
      return
    }
    if (this.client.state.control.locked) return
    this.move(this.pos(e))
    this.button(e.button + 1, down)
  }
  onWheel(e) {
    if (!this.active) return
    // the first event of a gesture scrolls immediately, then one step per WHEEL_STEP px
    const first = e.timeStamp - this.wheel.t > 250
    if (first) this.wheel = { x: 0, y: 0, t: e.timeStamp }
    const k = e.deltaMode !== 0 ? WHEEL_LINE_HEIGHT : 1
    this.wheel.x += e.deltaX * k
    this.wheel.y += e.deltaY * k
    // sensitivity -5..5: negative widens the step, positive scrolls more per step
    const { sensitivity, inverse } = this.client.state.control.scroll
    const step = sensitivity < 0 ? WHEEL_STEP * (1 - sensitivity) : WHEEL_STEP
    const amount = (sensitivity > 0 ? sensitivity + 1 : 1) * (inverse ? -1 : 1)
    const axis = (d) => {
      const v = this.wheel[d]
      if (!first && Math.abs(v) < step) return 0
      if (!first) this.wheel[d] = 0
      return Math.sign(v) * amount
    }
    const dx = axis('x')
    const dy = axis('y')
    if (dx || dy) this.client.input.scroll(dx, dy, e.ctrlKey)
  }
  hovering = false
  // keys go to the hidden input only while it is useful: a viewer typing in the chat must not lose
  // the focus by brushing the video (touch devices: focusing would pop up the on-screen keyboard)
  focusIfActive() {
    if (this.hovering && this.active && !this.client.isTouchDevice) this.input.focus()
  }
  onEnter(e) {
    this.hovering = true
    this.focusIfActive()
    if (this.client.controlling) {
      this.client.send('keyboard/modifiers', {
        capslock: e.getModifierState('CapsLock'),
        numlock: e.getModifierState('NumLock'),
      })
    }
  }
  onDrop(e) {
    if (!this.client.controlling && !this.client.implicitControl) return
    // dropped folders are skipped; walking webkitGetAsEntry() would be needed for them
    const files = [...(e.dataTransfer?.files ?? [])]
    if (files.length) this.client.uploadDrop({ ...this.pos(e), files })
  }
  /////////////////////////////
  // keyboard
  /////////////////////////////
  onKeyDown(key) {
    if (!this.active) {
      this.noKeyUp.add(key)
      return true
    }
    // Ctrl+V: the keystroke stays with the browser, whose paste event hands over the local
    // clipboard text (see onPaste). Ctrl itself was sent and stays held, so the next key has it.
    if (this.ctrlDown && key === XK.v) {
      this.noKeyUp.add(key)
      return true
    }
    if (isCtrl(key)) this.ctrlDown = key
    this.client.input.key(key, true)
    return isCtrl(key) // ctrl must reach the browser for the paste shortcut above
  }
  onKeyUp(key) {
    if (this.noKeyUp.delete(key)) return
    if (isCtrl(key)) this.ctrlDown = 0
    this.client.input.key(key, false)
  }
  // the remote gets its paste keystroke once the clipboard is settled. By then the user may have
  // let go of Ctrl, so the chord is completed with our own Ctrl when needed
  async onPaste(text) {
    if (!this.active) return
    await this.client.preparePaste(text)
    if (!this.active) return
    const ctrl = this.ctrlDown
    if (!ctrl) this.client.input.key(XK.Control_L, true)
    this.client.input.key(XK.v, true)
    this.client.input.key(XK.v, false)
    if (!ctrl) this.client.input.key(XK.Control_L, false)
  }
  mobileKeyboardToggle() {
    const open = this.client.state.mobile_keyboard_open
    if (open)
      this.input.blur() // the blur handler clears the flag; set it from `open`, not from the flag
    else this.input.focus()
    this.client.store.setState({ mobile_keyboard_open: !open })
  }
  /////////////////////////////
  // touch
  /////////////////////////////
  onTouch(e) {
    if (!this.client.controlling) {
      if (e.type === 'touchstart' && this.client.implicitControl) this.client.request()
      return // let the page scroll
    }
    e.preventDefault()
    e.stopPropagation()
    if (this.client.state.control.locked) return
    if (this.client.state.control.touch) {
      for (const t of e.changedTouches) {
        const p = this.pos(t)
        this.client.input.touch(TOUCH_PHASE[e.type], t.identifier, p.x, p.y, Math.round(t.force * 255))
      }
      return
    }
    // server without touch support: the first finger drives the left mouse button
    const t = e.changedTouches[0]
    this.move(this.pos(t))
    if (e.type === 'touchstart') this.button(1, true)
    else if (e.type !== 'touchmove') this.button(1, false)
  }
  /////////////////////////////
  // host changes + remote cursor
  /////////////////////////////
  onControl(controlling) {
    this.ctrlDown = 0
    this.noKeyUp.clear()
    this.updateCursorStyle()
    this.draw()
    const pending = this.pendingPress
    this.pendingPress = null
    // only a press from just now: control that arrives minutes later by other means (an admin
    // giving it) must not replay an old click
    if (controlling && pending && performance.now() - pending.at < 2000) {
      const e = pending.e
      this.move(this.pos(e))
      this.button(e.button + 1, true)
      if (!this.mouseDown) this.button(e.button + 1, false) // released while we waited
    }
  }
  onCursorImage(img) {
    const old = this.cursor
    this.cursor = img
    this.cursorImg.src = img.uri
    this.updateCursorStyle()
    if (old) URL.revokeObjectURL(old.uri)
  }
  onCursorPosition(p) {
    this.cursorPos = p
    this.draw()
  }
  clearCursor() {
    this.cursorPos = null
    this.draw()
  }
  // the host sees the remote cursor as their real mouse pointer
  updateCursorStyle() {
    const c = this.cursor
    this.input.style.cursor = this.client.controlling && c ? `url(${c.uri}) ${c.x} ${c.y}, default` : 'default'
  }
  // devicePixelRatio is read on resize only; listen to matchMedia(resolution) if
  // cursors look blurry after dragging the window to another monitor
  resize() {
    const { width, height } = this.size
    this.canvas.width = width * devicePixelRatio
    this.canvas.height = height * devicePixelRatio
    this.draw()
  }
  draw = () => {
    if (this.drawQueued) return
    this.drawQueued = true
    requestAnimationFrame(() => {
      this.drawQueued = false
      this.paint()
    })
  }
  // everyone but the host sees the host's cursor drawn here, tagged with their name
  paint() {
    const { ctx, cursor, cursorPos } = this
    const { width, height } = this.size
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    ctx.clearRect(0, 0, width, height)
    if (this.client.controlling || !cursor || !cursorPos || (cursor.width <= 1 && cursor.height <= 1)) return
    const screen = this.client.state.screen.size
    let x = Math.round((cursorPos.x / screen.width) * width)
    let y = Math.round((cursorPos.y / screen.height) * height)
    ctx.drawImage(this.cursorImg, x - cursor.x, y - cursor.y, cursor.width, cursor.height)
    const hostId = this.client.state.control.host_id
    const name = hostId ? this.client.state.sessions[hostId]?.profile.name : ''
    if (!name) return
    x += cursor.width
    y += cursor.height
    ctx.font = '14px Arial, sans-serif'
    ctx.textBaseline = 'top'
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 2
    ctx.lineWidth = 2
    ctx.fillStyle = 'black'
    ctx.strokeText(name, x, y)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'white'
    ctx.fillText(name, x, y)
  }
}
