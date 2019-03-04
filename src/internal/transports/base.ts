export interface TransportOptions {
  url: string
}

export interface Transport {
  get<T>(endpoint: string): Promise<T>
  post<T>(endpoint: string, data: any): Promise<T>
}

export abstract class BaseTransport implements Transport {
  protected constructor(public options: TransportOptions) {
  }

  get<T>(endpoint: string): Promise<T> {
    throw new Error('Transport has to implement `get` method')
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    throw new Error('Transport has to implement `post` method')
  }
}
