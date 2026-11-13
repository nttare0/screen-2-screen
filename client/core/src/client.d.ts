import { Emitter } from './emitter.js'
import { NekoApi } from './api.js'
import type { InputChannel, StreamTransport } from './transport.js'
import type { State, NekoEvents } from './types.js'
export interface SocketLike {
  readyState: number
  onmessage: WebSocket['onmessage']
  onclose: WebSocket['onclose']
  send(data: string): void
  close(code?: number): void
}
export interface NekoClientOptions {
  api?: NekoApi
  socket?: (url: string) => SocketLike
  autologin?: boolean
  autoconnect?: boolean
  autoplay?: boolean
  inputMode?: 'auto' | 'touch' | 'mouse'
  transport?: StreamTransport | (() => StreamTransport)
}
export interface Pos {
  x: number
  y: number
}
export declare const selectSession: (s: State) => import('./types.js').Session | null
export declare const selectControlling: (s: State) => boolean
export declare const selectIsAdmin: (s: State) => boolean
export declare class NekoClient {
  readonly store: Omit<import('zustand/vanilla').StoreApi<State>, 'subscribe'> & {
    subscribe: {
      (listener: (selectedState: State, previousSelectedState: State) => void): () => void
      <U>(
        selector: (state: State) => U,
        listener: (selectedState: U, previousSelectedState: U) => void,
        options?:
          | {
              equalityFn?: ((a: U, b: U) => boolean) | undefined
              fireImmediately?: boolean
            }
          | undefined,
      ): () => void
    }
  }
  readonly api: NekoApi
  readonly events: Emitter<NekoEvents>
  readonly transport: StreamTransport
  readonly input: InputChannel
  private ws
  private introduced
  private readonly messages
  private wanted
  private attempts
  private reconnectTimer
  private reconnectGen
  private staleTimer
  private lastMessage
  private resume
  private clipboardAt
  private localSeen
  private readonly opts
  constructor(opts?: NekoClientOptions)
  get state(): State
  private patch
  get connected(): boolean
  get controlling(): boolean
  get session(): import('./types.js').Session | null
  get isAdmin(): boolean
  get privateModeEnabled(): boolean
  get implicitControl(): boolean
  get isTouchDevice(): boolean
  setUrl(url?: string): void
  authenticate(token?: string | undefined): Promise<void>
  login(username: string, password: string): Promise<void>
  logout(): Promise<void>
  private setToken
  connect(): void
  disconnect(): void
  private close
  private openSocket
  private onSocketLost
  send(event: string, payload?: any): void
  private onTransportState
  private sessionInfo
  private onMessage
  private clear
  request(): void
  release(): void
  lock(): void
  unlock(): void
  paste(text: string): void
  preparePaste(text: string): Promise<void>
  setScrollInverse(value?: boolean): void
  setScrollSensitivity(value: number): void
  setKeyboard(layout: string, variant?: string): void
  private sendKeyboardMap
  setScreenSize(width: number, height: number, rate: number): void
  sendBroadcast(subject: string, body: any): void
  sendUnicast(receiver: string, subject: string, body: any): void
  uploadDrop({ x, y, files }: { x: number; y: number; files: File[] }): Promise<void>
  play(): Promise<void>
  pause(): void
  mute(): void
  unmute(): void
  setVolume(value: number): void
  shareMedia(stream: MediaStream): () => void
}
