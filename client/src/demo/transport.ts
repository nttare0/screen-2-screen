// A local canvas-to-video transport for the explicit preview. It is not WebRTC.
import {
  Emitter,
  type InputChannel,
  type SessionInfo,
  type StreamTransport,
  type TransportEvents,
  type TransportState,
} from '@m1k1o/neko'
import { DemoSurface } from './surface'

export class DemoTransport implements StreamTransport {
  readonly kind = 'demo' as const
  readonly input: InputChannel
  private readonly events = new Emitter<TransportEvents>()
  private readonly surface = new DemoSurface()
  private canvas: HTMLCanvasElement | null = null
  private stream: MediaStream | null = null
  private video: HTMLVideoElement | null = null
  private timer = 0
  private signalOff: (() => void) | null = null
  private width = 1600
  private height = 900
  private state: TransportState = {
    status: 'disconnected',
    size: { width: 1600, height: 900 },
    video: { playable: false, playing: false, volume: 1, muted: false, mutedByAutoplay: false },
  }

  constructor() {
    this.input = {
      move: (x, y) => {
        this.surface.cursor = this.toSurface(x, y)
      },
      scroll: () => {},
      button: (code, down) => {
        if (code === 1 && down && this.surface.cursor) this.surface.click(this.surface.cursor.x, this.surface.cursor.y)
      },
      key: () => {},
      touch: (phase, _id, x, y) => {
        const point = this.toSurface(x, y)
        this.surface.cursor = point
        if (phase === 'begin') this.surface.click(point.x, point.y)
      },
    }
  }

  get element() {
    return this.video
  }

  async connect(session: SessionInfo) {
    this.close()
    this.width = session.init.screen_size.width
    this.height = session.init.screen_size.height
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.draw()
    this.stream = this.canvas.captureStream(12)
    if (this.video) this.video.srcObject = this.stream
    this.state.status = 'connected'
    this.state.size = { width: this.width, height: this.height }
    this.timer = window.setInterval(() => this.draw(), 1000 / 12)
    this.signalOff = session.on('screen/updated', (size) => this.resize(size.width, size.height))
    this.sync()
    if (this.video) await this.setPlaying(true).catch(() => {})
  }

  close() {
    clearInterval(this.timer)
    this.signalOff?.()
    this.signalOff = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    if (this.video) {
      this.video.pause()
      this.video.srcObject = null
    }
    this.state.status = 'disconnected'
    this.state.video.playable = false
    this.state.video.playing = false
    this.surface.cursor = null
    this.sync()
  }

  attach(container: HTMLElement) {
    this.video?.remove()
    const video = (this.video = document.createElement('video'))
    video.playsInline = true
    video.autoplay = true
    video.setAttribute('aria-label', 'Locally rendered demonstration screen')
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:transparent'
    const v = this.state.video
    video.addEventListener('canplaythrough', () => {
      v.playable = true
      this.sync()
    })
    video.addEventListener('playing', () => {
      v.playing = true
      this.sync()
    })
    video.addEventListener('pause', () => {
      v.playing = false
      this.sync()
    })
    video.addEventListener('emptied', () => {
      v.playable = false
      v.playing = false
      this.sync()
    })
    video.addEventListener('volumechange', () => {
      v.muted = video.muted
      v.volume = video.volume
      this.sync()
    })
    video.muted = v.muted
    video.volume = v.volume
    if (this.stream) video.srcObject = this.stream
    container.append(video)
    return () => {
      video.remove()
      if (this.video === video) this.video = null
    }
  }

  async setPlaying(on: boolean) {
    if (!this.video) return
    if (!on) {
      this.video.pause()
      return
    }
    try {
      await this.video.play()
    } catch (err) {
      if (!this.video.muted || (err as DOMException).name !== 'NotAllowedError') throw err
      this.video.muted = true
      this.state.video.mutedByAutoplay = true
      await this.video.play()
    }
  }

  setVolume(volume: number) {
    if (this.video) this.video.volume = volume
  }

  setMuted(on: boolean) {
    if (this.video) this.video.muted = on
    if (!on) this.state.video.mutedByAutoplay = false
    this.sync()
  }

  on<K extends keyof TransportEvents>(event: K, cb: TransportEvents[K]) {
    return this.events.on(event, cb)
  }

  private toSurface(x: number, y: number) {
    return { x: (x / this.width) * 1600, y: (y / this.height) * 900 }
  }

  private resize(width: number, height: number) {
    this.width = width
    this.height = height
    if (this.canvas) {
      this.canvas.width = width
      this.canvas.height = height
    }
    this.state.size = { width, height }
    this.draw()
    this.sync()
  }

  private draw() {
    const ctx = this.canvas?.getContext('2d')
    if (ctx && this.canvas) this.surface.draw(ctx, this.canvas.width, this.canvas.height)
  }

  private sync() {
    this.events.emit('state', {
      status: this.state.status,
      size: { ...this.state.size },
      video: { ...this.state.video },
    })
  }
}
