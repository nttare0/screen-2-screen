import type { InputChannel } from '../transport.js'
export declare class WebSocketInput implements InputChannel {
  private readonly socket
  private pending
  private moveTimer
  constructor(socket: { send(event: string, payload?: unknown): void })
  move(x: number, y: number): void
  scroll(deltaX: number, deltaY: number, controlKey: boolean): void
  button(code: number, down: boolean): void
  key(keysym: number, down: boolean): void
  touch(phase: 'begin' | 'update' | 'end', id: number, x: number, y: number, pressure: number): void
  private flush
}
