import { IWavesItems, TCreateItemParams, TIntent, TItem, TItemMisc, TItemOrder } from './interface'
import { issue, data, IDataTransaction, IIssueTransaction, WithId, order, cancelOrder, IOrder, TTx, ICancelOrder } from '@waves/waves-transactions'
import { TChainId, crypto, MAIN_NET_CHAIN_ID, ChaidId } from '@waves/waves-crypto'
import { wavesApi } from '@waves/waves-rest'
import { config } from '@waves/waves-rest/config'
import { axiosHttp } from '@waves/waves-rest/http-bindings'
import './extensions'
import axios from 'axios'
import { urlRegexp } from './generic'
import * as memoizee from 'memoizee'

type TItemPayload = {
  version: number
  name: string
  imageUrl: string
  misc: TItemMisc
}

export const wavesItems = (chainId: TChainId): IWavesItems => {

  const { address } = crypto()

  const cfg = ChaidId.isMainnet(chainId) ? config.mainnet : config.testnet

  const { broadcast, getIssueTxs, getKeyValuePairs, getAssetsBalance, getAssetInfo, getValueByKey, placeOrder, cancelOrder: cancelOrderApi } = wavesApi(cfg, axiosHttp(axios))

  const createItem = (params: TCreateItemParams): TIntent<TItem, [IIssueTransaction & WithId, IDataTransaction & WithId]> => {

    const txs = memoizee((seed: string): [IIssueTransaction & WithId, IDataTransaction & WithId] => {

      const i = issue({ quantity: params.quantity, reissuable: false, chainId, decimals: 0, name: 'ITEM', description: '' }, seed)

      const payload: TItemPayload = {
        version: params.version,
        name: params.name,
        imageUrl: params.imageUrl,
        misc: params.misc,
      }

      const d = data({ data: [{ key: i.id, value: JSON.stringify(payload) }] }, seed)

      return [i, d]
    })

    const result = (seed: string): TItem => {
      const [issue] = txs(seed)

      return {
        id: issue.id,
        name: params.name,
        quantity: params.quantity,
        gameId: address(seed),
        created: issue.timestamp,
        imageUrl: params.imageUrl,
        misc: params.misc,
      }
    }

    return {
      entries: txs,
      result,
      broadcast: async (seed: string): Promise<TItem> => {
        const [issue, data] = txs(seed)
        await Promise.all([
          broadcast(issue),
          broadcast(data),
        ])

        return result(seed)
      },
    }
  }

  const validURL = (str: string) =>
    urlRegexp.test(str)

  const validateItemPayload = (data: string, version: number = 1) => {
    try {
      const d = JSON.parse(data) as TItemPayload

      if (!d.name || !d.imageUrl || d.version != version)
        throw new Error('Invalid payload.')

      if (!validURL(d.imageUrl))
        throw new Error('Invalid image url.')

    } catch (error) {
      return false
    }

    return true
  }

  const toPayload = (data: string): TItemPayload => JSON.parse(data) as TItemPayload

  const toInt = (value: string | number) => parseInt(value.toString())

  const getItemCatalog = async (gameId: string): Promise<TItem[]> => {
    const [issues, kvp] = await Promise.all([
      await getIssueTxs({ sender: gameId }).all().then(i => i.toRecord(x => x.id)),
      await getKeyValuePairs(gameId),
    ])

    const items: TItem[] = kvp
      .filter(({ key, value }) => issues[key] != undefined && validateItemPayload(value))
      .map(({ key, value }) => ({
        id: key,
        gameId,
        quantity: toInt(issues[key].quantity),
        created: issues[key].timestamp,
        ...toPayload(value),
      }))

    return items
  }

  const getUserItems = async (gameId: string, address: string): Promise<TItem[]> => {
    const { balances } = await getAssetsBalance(address)
    const items = (await getItemCatalog(gameId)).toRecord(x => x.id)
    return balances.map(({ assetId }) => items[assetId]).filter(x => x != undefined)
  }

  const getItem = async (itemId: string): Promise<TItem> => {
    const { assetId, issuer, quantity, issueTimestamp } = await getAssetInfo(itemId)
    const { value } = await getValueByKey(issuer, assetId)

    if (!validateItemPayload(value))
      throw new Error('Invalid item payload.')

    return {
      id: itemId,
      gameId: issuer,
      quantity: toInt(quantity),
      created: issueTimestamp,
      ...toPayload(value),
    }
  }

  const buyItem = (itemId: string, price: number): TIntent<TItemOrder, IOrder> => {
    const entries = (seed: string) =>
      order({
        amount: 1,
        price: price,
        matcherPublicKey: cfg.matcherPublicKey,
        orderType: 'buy',
        amountAsset: itemId,
        priceAsset: null,
      }, seed)

    return ({
      entries,
      result: undefined,
      broadcast: async (seed: string): Promise<TItemOrder> => {
        const o = entries(seed)
        const item = await getItem(itemId)
        const { id } = await placeOrder(o)
        return { id, price, item, type: 'buy' }
      },
    })
  }

  const sellItem = (itemId: string, price: number): TIntent<TItemOrder, IOrder> => {
    const entries = (seed: string) =>
      order({
        amount: 1,
        price: price,
        matcherPublicKey: cfg.matcherPublicKey,
        orderType: 'buy',
        amountAsset: itemId,
        priceAsset: null,
      }, seed)

    return ({
      entries,
      result: undefined,
      broadcast: async (seed: string): Promise<TItemOrder> => {
        const o = entries(seed)
        const item = await getItem(itemId)
        const { id } = await placeOrder(o)
        return { id, price, item, type: 'sell' }
      },
    })
  }

  const _cancelOrder = (order: TItemOrder): TIntent<{}, ICancelOrder> => {
    const entries = (seed: string) =>
      cancelOrder({ orderId: order.id }, seed)

    return {
      entries,
      result: undefined,
      broadcast: async (seed: string): Promise<{}> => {
        const o = entries(seed)
        await cancelOrderApi(order.item.id, 'WAVES', o)
        return {}
      },
    }
  }

  return {
    createItem,
    getItem,
    getUserItems,
    getItemCatalog,
    buyItem,
    sellItem,
    cancelOrder: _cancelOrder,
  }
}

async function main() {
  const items = await wavesItems(MAIN_NET_CHAIN_ID).getItemCatalog('3PKEQiRe2u6488jdvUAUYshrM4fQPf4omak')
  console.log(items)
}


//main()
//3PKEQiRe2u6488jdvUAUYshrM4fQPf4omak