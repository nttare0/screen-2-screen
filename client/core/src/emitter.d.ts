export declare class Emitter<
  E extends {
    [K in keyof E]: (...args: any[]) => void
  },
> {
  private handlers
  on<K extends keyof E>(event: K, fn: E[K]): () => void
  off<K extends keyof E>(event: K, fn: E[K]): void
  once<K extends keyof E>(event: K, fn: E[K]): () => void
  emit<K extends keyof E>(event: K, ...args: Parameters<E[K]>): void
}
