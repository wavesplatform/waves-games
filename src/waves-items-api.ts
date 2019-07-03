import { IWavesItemsApi, IIntent, IItemOrder, TItem, IParamMap, IItemMap, TIssue, TData, IUserInventory } from './interface'
import { issue, data, order, cancelOrder, IOrder, ICancelOrder } from '@waves/waves-transactions'
import { TChainId, crypto, ChaidId } from '@waves/waves-crypto'
import { wavesApi, config, axiosHttp } from '@waves/waves-rest'
import './extensions'
import axios from 'axios'
import memoizee from 'memoizee'
import { IDataPayloadV1, IItemV1 } from './v1'
import { parseItem } from './parse-item'
import { Versions } from './versions'
import { parseDataPayload } from './data-payload'
import { toInt } from './utils'

export const wavesItemsApi = (chainId: TChainId): IWavesItemsApi => {
  const { address } = crypto()

  const cfg = ChaidId.isMainnet(chainId) ? config.mainnet : config.testnet

  const { broadcast, getIssueTxs, getKeyValuePairs, getAssetsBalance, getAssetInfo, getValueByKey, placeOrder, cancelOrder: cancelOrderApi } = wavesApi(cfg, axiosHttp(axios))

  const createItem = <V extends Versions>(params: IParamMap[V]): IIntent<IItemMap[V], [TIssue, TData]> => {
    const txs = memoizee((seed: string): [TIssue, TData] => {
      switch (params.version) {
        case 1: {
          const payload: IDataPayloadV1 = {
            version: params.version,
            name: params.name,
            imageUrl: params.imageUrl,
            misc: params.misc,
          }

          const jsonPayload = JSON.stringify(payload)
          parseDataPayload(jsonPayload, 'throw')

          const i = {
            sender: address(seed, chainId),
            ...issue({ quantity: params.quantity, reissuable: false, chainId, decimals: 0, name: 'ITEM', description: '' }, seed),
          }

          const d = {
            sender: address(seed, chainId),
            ...data({ data: [{ key: i.id, value: jsonPayload }] }, seed),
          }

          return [i, d]
        }

        default:
          throw new Error(`Vertion ${params.version} is not supported`)
      }
    })

    const result = (seed: string): IItemMap[V] => {
      const [issue] = txs(seed)

      return {
        version: 1,
        id: issue.id,
        name: params.name,
        quantity: params.quantity,
        gameId: address(seed),
        created: issue.timestamp,
        imageUrl: params.imageUrl,
        misc: params.misc || {},
      }
    }

    return {
      entries: txs,
      result,
      broadcast: async (seed: string): Promise<IItemV1> => {
        const [issue, data] = txs(seed)
        await Promise.all([broadcast(issue), broadcast(data)])

        return result(seed)
      },
    }
  }

  const getItemCatalog = async (gameId: string): Promise<TItem[]> => {
    const [issues, kvp] = await Promise.all([
      await getIssueTxs({ sender: gameId })
        .all()
        .then(i => i.toRecord(x => x.id)),
      await getKeyValuePairs(gameId),
    ])

    return kvp
      .filter(({ key }) => issues[key] != undefined)
      .map(kvp => {
        try {
          return parseItem(issues[kvp.key], kvp)
        } catch (error) {
          return undefined
        }
      })
      .filter(x => x != undefined)
  }

  const getUserInventory = async (gameId: string, address: string): Promise<IUserInventory> => {
    const { balances } = await getAssetsBalance(address)
    const i = (await getItemCatalog(gameId)).toRecord(x => x.id)
    const items = balances.filter(({ assetId }) => i[assetId]).map(({ balance, assetId }) => ({ balance: toInt(balance), item: i[assetId] }))
    return { items }
  }

  const getItem = async (itemId: string): Promise<TItem> => {
    const info = await getAssetInfo(itemId)
    const { value } = await getValueByKey(info.issuer, info.assetId)

    return parseItem(info, { key: info.assetId, value, type: 'string' })
  }

  const buyItem = (itemId: string, price: number): IIntent<IItemOrder, IOrder> => {
    const entries = (seed: string) =>
      order(
        {
          amount: 1,
          price: price,
          matcherPublicKey: cfg.matcherPublicKey,
          orderType: 'buy',
          amountAsset: itemId,
          priceAsset: null,
        },
        seed,
      )

    return {
      entries,
      result: undefined,
      broadcast: async (seed: string): Promise<IItemOrder> => {
        const o = entries(seed)
        const item = await getItem(itemId)
        const { id } = await placeOrder(o)
        return { id, price, item, type: 'buy' }
      },
    }
  }

  const sellItem = (itemId: string, price: number): IIntent<IItemOrder, IOrder> => {
    const entries = (seed: string) =>
      order(
        {
          amount: 1,
          price: price,
          matcherPublicKey: cfg.matcherPublicKey,
          orderType: 'buy',
          amountAsset: itemId,
          priceAsset: null,
        },
        seed,
      )

    return {
      entries,
      result: undefined,
      broadcast: async (seed: string): Promise<IItemOrder> => {
        const o = entries(seed)
        const item = await getItem(itemId)
        const { id } = await placeOrder(o)

        return { id, price, item, type: 'sell' }
      },
    }
  }

  const _cancelOrder = (order: IItemOrder): IIntent<{}, ICancelOrder> => {
    const entries = (seed: string) => cancelOrder({ orderId: order.id }, seed)

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
    getUserInventory,
    getItemCatalog,
    buyItem,
    sellItem,
    cancelOrder: _cancelOrder,
  }
}
