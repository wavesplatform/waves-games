import { ChainId, ClientOptions, Item, ItemParams, LONG, Price } from './types'
import { IOrder, TSeedTypes } from '@waves/waves-transactions'
import { Api, ApiOptions } from './api'
import { config } from './config'

export class Client {
  // Mainnet or Testnet
  chainId: ChainId

  // Private seed of sender
  private _seed: TSeedTypes
  private _api: Api

  constructor(options: ClientOptions) {
    this._seed = options.seed
    this.chainId = options.chainId

    const chain = config.chains[options.chainId]
    const apiOptions: ApiOptions = {
      nodeUri: chain.nodeUri,
      matcherUri: chain.matcherUri,
    }

    this._api = new Api(apiOptions)
  }

  async getItem<TItemMisc = any>(itemId: string): Promise<Item<TItemMisc>> {
    return Promise.resolve(<any>{})
  }

  async getItemList<TItemMisc = any>(creatorAddress: string): Promise<Item<TItemMisc>[]> {
    return Promise.resolve(<any[]>[])
  }

  async createItem(params: ItemParams<any>, quantity: LONG, reissuable: boolean): Promise<Item> {
    return Promise.resolve(<any>{})
  }

  async sellItem(itemId: string, amount: LONG, price: Price): Promise<IOrder> {
    return Promise.resolve(<any>{})
  }

  async buyItem(itemId: string, amount: LONG, price: Price): Promise<IOrder> {
    return Promise.resolve(<any>{})
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    return Promise.resolve(true)
  }
}
