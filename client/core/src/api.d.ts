export declare class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string)
}
export declare class NekoApi {
  url: string
  token: string
  private headers
  req<T = void>(method: string, path: string, body?: unknown, init?: RequestInit): Promise<T>
  downloadUrl(path: string): string
  blob(path: string): Promise<Blob>
  upload(path: string, form: FormData, onProgress?: (p: { loaded: number; total: number }) => void): Promise<void>
}
