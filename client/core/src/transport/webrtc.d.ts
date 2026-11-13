import { DataChannelInput } from '../input/datachannel.js'
import type { SessionInfo, StreamTransport, TransportEvents } from '../transport.js'
export declare class WebRTCTransport implements StreamTransport {
  readonly kind: 'webrtc'
  readonly input: DataChannelInput
  static supported(): boolean
  private readonly events
  private readonly state
  private video
  private session
  private unsubs
  private pc
  private candidates
  private failures
  private retryTimer
  private offerTimer
  constructor()
  get element(): HTMLVideoElement | null
  on<K extends keyof TransportEvents>(event: K, cb: TransportEvents[K]): () => void
  connect(session: SessionInfo): Promise<void>
  close(): void
  private unsubscribe
  private requestPeer
  private closePeer
  private onProvide
  private onOffer
  private onPeerState
  private onTrack
  shareMedia(stream: MediaStream): () => void
  attach(container: HTMLElement): () => void
  setPlaying(on: boolean): Promise<void>
  setVolume(volume: number): void
  setMuted(on: boolean): void
  private play
  private setStatus
  private emitState
}
