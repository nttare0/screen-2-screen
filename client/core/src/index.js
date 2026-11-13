// Modified for Screen 2 Screen: redesign and connection-adapter integration.
// @m1k1o/neko: everything needed to talk to a neko server, usable from any framework.
// The GUI in ../src imports only from here.
export { NekoClient, selectSession, selectControlling, selectIsAdmin } from './client.js'
export { Overlay } from './overlay.js'
export { mount } from './mount.js'
export { Emitter } from './emitter.js'
export { NekoApi, ApiError } from './api.js'
export { WebRTCTransport } from './transport/webrtc.js'
export { DataChannelInput } from './input/datachannel.js'
export { WebSocketInput } from './input/websocket.js'
