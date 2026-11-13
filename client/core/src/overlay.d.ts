import { type NekoClient } from './client.js'
export declare class Overlay {
  readonly wrap: HTMLDivElement
  private readonly canvas
  private readonly ctx
  private readonly input
  private readonly keyboard
  private readonly cleanup
  private box
  private size
  private cursor
  private readonly cursorImg
  private cursorPos
  private drawQueued
  private wheel
  private lastMove
  private moveTimer
  private mouseDown
  private pendingPress
  private ctrlDown
  private readonly noKeyUp
  private readonly client
  constructor(client: NekoClient)
  attach(box: HTMLElement): () => void
  private detach
  private get visible()
  private get interactive()
  private sync
  private onResize
  private get active()
  private pos
  private move
  private button
  private onMove
  private sendMove
  private onButton
  private onWheel
  private hovering
  private focusIfActive
  private onEnter
  private onDrop
  private onKeyDown
  private onKeyUp
  private onPaste
  mobileKeyboardToggle(): void
  private onTouch
  private onControl
  private onCursorImage
  private onCursorPosition
  private clearCursor
  private updateCursorStyle
  private resize
  private draw
  private paint
}
