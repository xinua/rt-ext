/** Envelope of every socket.io `message` event the Retriever app emits. */
export interface WsMessage<T = unknown> {
  type: string;
  data: T;
}
