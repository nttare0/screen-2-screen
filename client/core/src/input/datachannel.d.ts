import type { InputChannel } from '../transport.js'
import type { CursorImage } from '../types.js'
export declare class DataChannelInput implements InputChannel {
  private dc
  onCursorPosition?: (pos: { x: number; y: number }) => void
  onCursorImage?: (image: CursorImage) => void
  bind(dc: RTCDataChannel | null): void
  move(x: number, y: number): void
  scroll(deltaX: number, deltaY: number, controlKey: boolean): void
  button(code: number, down: boolean): void
  key(keysym: number, down: boolean): void
  touch(phase: 'begin' | 'update' | 'end', id: number, x: number, y: number, pressure: number): void
  private send
}
