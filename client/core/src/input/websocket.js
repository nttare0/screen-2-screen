const MOVE_COALESCE_MS = 16
export class WebSocketInput {
  socket
  pending = null
  moveTimer = 0
  constructor(socket) {
    this.socket = socket
  }
  // one move per frame, the latest wins
  move(x, y) {
    this.pending = { x, y }
    if (!this.moveTimer) this.moveTimer = window.setTimeout(() => this.flush(), MOVE_COALESCE_MS)
  }
  scroll(deltaX, deltaY, controlKey) {
    this.flush()
    this.socket.send('control/scroll', { delta_x: deltaX, delta_y: deltaY, control_key: controlKey })
  }
  button(code, down) {
    this.flush() // a click lands where the pointer is now
    this.socket.send(down ? 'control/buttondown' : 'control/buttonup', { code })
  }
  key(keysym, down) {
    this.flush()
    this.socket.send(down ? 'control/keydown' : 'control/keyup', { keysym })
  }
  touch(phase, id, x, y, pressure) {
    this.flush()
    this.socket.send(`control/touch${phase}`, { touch_id: id, x, y, pressure })
  }
  flush() {
    clearTimeout(this.moveTimer)
    this.moveTimer = 0
    if (!this.pending) return
    this.socket.send('control/move', this.pending)
    this.pending = null
  }
}
