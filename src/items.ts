import { issue, data, burn, reissue, order, broadcast, cancelOrder } from '@waves/waves-transactions'
import { Distribution, Currency, Price, ChainId, Intent, AssetInfo, ItemParams, AmountPricePair, OrderbookPair } from "./types"
import { config } from "./config"
import { IIssueParams, IReissueParams, IBurnParams, IIssueTransaction, IDataParams, IDataTransaction, IOrder, IBurnTransaction, IReissueTransaction, WithId, ICancelOrder } from '@waves/waves-transactions/transactions'
import { TSeedTypes } from '@waves/waves-transactions/types'
import { address, PublicKey } from 'waves-crypto'
import { getAssetInfo, getItemParams, getItemDistribution, createOrder, getItemDetailsList, getOrderbookPair } from './general'

export interface Item<T = any> {
  id: string,
  amount: string | number,
  gameId: string,
  img: string,
  name: string,
  isLimited: boolean,
  timestamp?: number
  misc: T,
  rawParams: ItemParams,
  distribution?: Distribution
}

export interface IItems {
  /**
   * Returns an item info from the blockchain.
   *
   * ### Usage
   * ```js
   * const { Items } = require('@waves/waves-games')
   * const { getItem } = Items(ChainId.Testnet)
   *
   * getItem(itemId).then(item => {
   *    console.log(item)
   * })
   *
   * ```
   *
   */
  getItem: (id: string, includeDistribution: boolean) => Promise<Item>

  /**
   * Returns an item list issued by particular game creator.
   *
   * ### Usage
   * ```js
   * const { Items } = require('@waves/waves-games')
   * const { getItemList } = Items(ChainId.Testnet)
   *
   * getItemList('creatorAddress').then(items => {
   *    console.log(items)
   * })
   *
   * ```
   *
   */
  getItemList: (creatorAddress: string) => Promise<Item[]>
  /**
   * Returns an item available on market.
   *
   * ### Usage
   * ```js
   * const { Items } = require('@waves/waves-games')
   * const { getItemSuply } = Items(ChainId.Testnet)
   *
   * //getting all orders for sale for BTC
   * getItemSuply('itemId', 'BTC').then(items => {
   *    console.log(items)
   * })
   *
   * ```
   *
   */
  getItemSuply(itemId: string, currency: Currency): Promise<Record<number, number>>

  /**
   * Creates an item.
   *
   * ### Usage
   * ```js
   * const { Items } = require('@waves/waves-games')
   * const { create } = Items(ChainId.Testnet)
   *
   * const items = Items(ChainId.Testnet)
   * const request = create(100, true, { version: 1, main: { name: 'The sword of pain', img: 'img_url' }, misc: {} }, 'creatorSeed')
   * const item = await request.execute()
   *
   * ```
   *
   */
  create: (amount: number, isLimited: boolean, params: ItemParams, seed: TSeedTypes) => Intent<Item>
  changeAmount: (itemId: string, by: number, freeze: boolean, seed: string) => Intent<boolean>
  sell: (itemId: string, price: Price, amount: number, seed: string) => Intent<IOrder>
  buy: (itemId: string, price: Price, amount: number, seed: string) => Intent<IOrder>
  cancel: (orderId: string, amountPricePair: AmountPricePair, seed: string) => Intent<boolean>
}

export function Items(chainId: ChainId): IItems {
  const { nodeUri, matcherUri, matcher, btcId, ethId } = config.chains[chainId]

  const currencies: { readonly [c in Currency]: string } = {
    BTC: btcId,
    ETH: ethId,
    WAVES: config.wavesId
  }

  async function getItem<TItemMisc = any>(id: string, includeDistribution: boolean = false): Promise<Item<TItemMisc>> {
    try {
      const assetInfo = await getAssetInfo(id, nodeUri)
      const itemParams = await getItemParams(assetInfo.issuer, id, nodeUri)
      const distribution = !includeDistribution ? undefined : await getItemDistribution(id, nodeUri)
      const item = _buildItem(assetInfo, itemParams)

      return {
        ...item,
        distribution,
      }
    } catch (err) {
      throw err
    }
  }

  async function getItemList<TItemMisc = any>(creatorAddress: string): Promise<Item<TItemMisc>[]> {
    try {
      const itemDetailsList = await getItemDetailsList(creatorAddress, nodeUri)
      const itemList = await Promise.all(itemDetailsList.map(async itemDetails => {
        const itemId = itemDetails.key
        const assetInfo = await getAssetInfo(itemId, nodeUri)
        const itemParams = JSON.parse(itemDetails.value)
        return _buildItem(assetInfo, itemParams)
      }))

      return itemList
    } catch (err) {
      throw err
    }
  }

  async function getItemSuply(itemId: string, currency: Currency): Promise<Record<number, number>> {
    try {
      // const orderbook = await getOrderbookPair(itemId, currencies[currency], matcherUri)
      const orderbook = {
        asks: [{ amount: 2, price: 123300000000 }]
      } as OrderbookPair
      const suply = []

      for (const ask of orderbook.asks) {
        suply[ask.price] = ask.amount
      }

      return suply
    } catch (err) {
      throw err
    }
  }

  function create(amount: number, isLimited: boolean, params: ItemParams, seed: TSeedTypes): Intent<Item> {
    const issueParams: IIssueParams = {
      decimals: 0,
      quantity: amount,
      reissuable: !isLimited,
      description: ``,
      name: 'ITEM',
      chainId,
    }
    const issueTx: IIssueTransaction & WithId = issue(issueParams, seed)

    const dataParams: IDataParams = {
      data: [{
        key: issueTx.id,
        value: JSON.stringify(params)
      }]
    }
    const dataTx: IDataTransaction = data(dataParams, seed)

    const entries = [issueTx, dataTx]

    return {
      entries,
      execute: () => new Promise<Item>(async (resolve, reject) => {
        try {
          await Promise.all(
            entries.map(entry => broadcast(entry, nodeUri))
          )
          resolve(_buildItem(issueTx, params))
        } catch (err) {
          reject(err)
        }
      })
    }
  }

  function changeAmount(itemId: string, by: number, freeze: boolean, seed: TSeedTypes): Intent<boolean> {
    const isBurned = by < 0
    const txParams: IReissueParams | IBurnParams = {
      assetId: itemId,
      quantity: isBurned ? -by : by,
      reissuable: !freeze,
      chainId
    }
    const changeTx: IBurnTransaction | IReissueTransaction = isBurned ? burn(txParams, seed) : reissue(txParams, seed)

    const entries = [changeTx]

    if (freeze && isBurned) {
      txParams.quantity = 0
      const freezeTx: IReissueTransaction = reissue(txParams, seed)

      entries.push(freezeTx)
    }

    return {
      entries,
      execute: () => new Promise<boolean>(async (resolve, reject) => {
        try {
          await Promise.all(
            entries.map(entry => broadcast(entry, nodeUri))
          )
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    }
  }

  function sell(itemId: string, price: Price, amount: number, seed: TSeedTypes): Intent<IOrder> {
    const orderEntry: IOrder = order({
      amount,
      price: price.value,
      matcherPublicKey: matcher,
      orderType: 'sell',
      amountAsset: itemId,
      priceAsset: price.assetId
    }, seed)

    const entries = [orderEntry]

    return {
      entries,
      execute: () => new Promise<IOrder>(async (resolve, reject) => {
        try {
          const order = await createOrder(entries[0], matcherUri)
          resolve(order)
        } catch (err) {
          reject(err)
        }
      })
    }
  }

  function buy(itemId: string, price: Price, amount: number, seed: TSeedTypes): Intent<IOrder> {
    const orderEntry: IOrder = order({
      amount,
      price: price.value,
      matcherPublicKey: matcher,
      orderType: 'buy',
      amountAsset: itemId,
      priceAsset: price.assetId
    }, seed)

    const entries = [orderEntry]

    return {
      entries,
      execute: () => new Promise<IOrder>(async (resolve, reject) => {
        try {
          const order = await createOrder(entries[0], matcherUri)
          resolve(order)
        } catch (err) {
          reject(err)
        }
      })
    }
  }

  function cancel(orderId: string, amountPricePair: AmountPricePair, seed: TSeedTypes): Intent<boolean> {
    const cancelOrderEntry: ICancelOrder = cancelOrder({
      orderId
    }, seed as string)

    const entries = [cancelOrderEntry]

    return {
      entries,
      execute: () => new Promise<boolean>(async (resolve, reject) => {
        try {
          resolve(true)
        } catch (err) {
          reject(err)
        }
      })
    }
  }

  function _buildItem(data: AssetInfo | any, itemParams: ItemParams): Item {
    const { name, img } = itemParams.main

    return {
      id: data.assetId || data.id,
      gameId: data.issuer || address({ public: data.senderPublicKey } as PublicKey, chainId),
      name,
      img,
      amount: data.quantity,
      isLimited: !data.reissuable,
      misc: itemParams.misc,
      rawParams: itemParams,
      timestamp: data.issueTimestamp || data.timestamp
    } as Item
  }

  const waves = (value: number): Price => ({ value: value * Math.pow(10, 8), assetId: null })
  const btc = (value: number): Price => ({ value: value * Math.pow(10, 8), assetId: btcId })
  const eth = (value: number): Price => ({ value: value * Math.pow(10, 8), assetId: ethId })

  return {
    getItem,
    getItemList,
    getItemSuply,
    create,
    changeAmount,
    sell,
    buy,
    cancel
  }
}

