
export const OrderWSClientSettings = {
  // sleep time between close and reconnect, in ms
  reconnectDelay: 10000,
  // connecting timeout, in ms
  handshakeTimeout: 15000,
  // max duration between server pong messages, in ms
  aliveTimeout: 30000,
  // ping interval, in ms. 0 == disable
  pingInterval: 15000
}
