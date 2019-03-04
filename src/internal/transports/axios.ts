import { TransportOptions, BaseTransport } from './base'
import axios, { AxiosError, AxiosResponse } from 'axios'

export class AxiosTransport extends BaseTransport {
  constructor(public options: TransportOptions) {
    super(options)
  }

  get<T>(endpoint: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      axios.get<T>(endpoint, { baseURL: this.options.url })
        .then((res: AxiosResponse) => resolve(res.data))
        .catch((err: AxiosError) => reject(err))
    })
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      axios.post<T>(endpoint, data, { baseURL: this.options.url })
        .then((res: AxiosResponse) => resolve(res.data))
        .catch((err: AxiosError) => reject(err))
    })
  }
}
