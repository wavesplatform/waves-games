import { Transport } from './transports/base'
import { AxiosTransport } from './transports/axios'
import { IOrder } from '@waves/waves-transactions'

export interface ApiOptions {
  nodeUri: string,
  matcherUri: string,
}

export interface OrderData {
  sender: string,
  orderId: string,
  signature: string
}

export class Api {
  node: Transport
  matcher: Transport

  constructor(public options: ApiOptions) {
    this.node = new AxiosTransport({ url: options.nodeUri })
    this.matcher = new AxiosTransport({ url: options.matcherUri })
  }

  async createOrder(order: IOrder): Promise<IOrder> {
    return await this.matcher.post<IOrder>('orderbook', order)
  }

  async cancelOrder(orderData: OrderData): Promise<IOrder> {
    return await this.matcher.post<IOrder>('orderbook/cancel', orderData)
  }
}
