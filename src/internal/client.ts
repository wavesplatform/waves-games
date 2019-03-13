import { ChainId, ClientOptions, Item, ItemParams, LONG, Price } from './types'
import { broadcast, data, IDataParams, IIssueParams, IOrder, issue, TSeedTypes } from '@waves/waves-transactions'
import { Api, ApiOptions } from './api'
import { config } from './config'
import { ItemBuilder } from './helpers/item-builder'

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
    const issueParams: IIssueParams = {
      decimals: 0,
      quantity,
      reissuable,
      name: 'ITEM',
      description: '',
      chainId: this.chainId,
    }
    const issueTx = issue(issueParams, this._seed)

    const dataParams: IDataParams = {
      data: [{
        key: issueTx.id,
        value: JSON.stringify(params),
      }],
    }
    const dataTx = data(dataParams, this._seed)

    const nodeUri = this._api.options.nodeUri
    await Promise.all([broadcast(issueTx, nodeUri), broadcast(dataTx, nodeUri)])

    const item: Item = new ItemBuilder(issueTx)
      .setItemParams(params)
      .build()

    return item
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
