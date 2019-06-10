import { IWavesItems, TCreateItemParams, TIntent, TItem, TItemMisc, TItemOrder } from './interface'
import { issue, data, IDataTransaction, IIssueTransaction, WithId, order, cancelOrder } from '@waves/waves-transactions'
import { TChainId, crypto, MAIN_NET_CHAIN_ID, ChaidId } from '@waves/waves-crypto'
import { wavesApi } from '@waves/waves-rest'
import { config } from '@waves/waves-rest/config'
import { axiosHttp } from '@waves/waves-rest/http-bindings'
import './extensions'
import axios from 'axios'

type TItemPayload = {
  version: number,
  name: string,
  imageUrl: string,
  misc: TItemMisc,
}

export const wavesItems = (chainId: TChainId): IWavesItems => {

  const { address } = crypto()

  const cfg = ChaidId.isMainnet(chainId) ? config.mainnet : config.testnet

  const { broadcast, getIssueTxs, getKeyValuePairs, getAssetsBalance, getAssetInfo, getValueByKey, placeOrder, cancelOrder: cancelOrderApi } = wavesApi(cfg, axiosHttp(axios))

  const createItem = (params: TCreateItemParams): TIntent<TItem> => {

    const txs = (seed: string): [IIssueTransaction & WithId, IDataTransaction & WithId] => {

      const i = issue({ quantity: params.quantity, reissuable: false, chainId, decimals: 0, name: 'ITEM', description: '' }, seed)

      const payload: TItemPayload = {
        version: params.version,
        name: params.name,
        imageUrl: params.imageUrl,
        misc: params.misc,
      }

      const d = data({ data: [{ key: i.id, value: JSON.stringify(payload) }] }, seed)

      return [i, d]
    }

    return {
      broadcast: async (seed: string): Promise<TItem> => {
        const [issue, data] = txs(seed)

        await Promise.all([
          broadcast(<any>issue),
          broadcast(<any>data)
        ])

        return {
          id: issue.id,
          name: params.name,
          quantity: params.quantity,
          gameId: address(seed),
          created: Date.now(),
          imageUrl: params.imageUrl,
          misc: params.misc,
        }

      }
    }
  }

  const validURL = (str: string) => {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
      .compile()

    return pattern.test(str)
  }

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
      await getKeyValuePairs(gameId)
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

  const buyItem = (itemId: string, price: number): TIntent<TItemOrder> => {
    return {
      broadcast: async (seed: string): Promise<TItemOrder> => {

        const o = order({
          amount: 1,
          price: price,
          matcherPublicKey: cfg.matcherPublicKey,
          orderType: 'buy',
          amountAsset: itemId,
          priceAsset: null,
        }, seed)


        const item = await getItem(itemId)
        const { id } = await placeOrder(o)
        return { id, price, item, type: 'buy' }
      }
    }
  }


  const sellItem = (itemId: string, price: number): TIntent<TItemOrder> => {
    return {
      broadcast: async (seed: string): Promise<TItemOrder> => {

        const o = order({
          amount: 1,
          price: price,
          matcherPublicKey: cfg.matcherPublicKey,
          orderType: 'sell',
          amountAsset: itemId,
          priceAsset: null,
        }, seed)


        const item = await getItem(itemId)
        const { id } = await placeOrder(o)
        return { id, price, item, type: 'sell' }
      }
    }
  }

  const _cancelOrder = (order: TItemOrder): TIntent<{}> => {
    return {
      broadcast: async (seed: string): Promise<{}> => {
        const o = cancelOrder({ orderId: order.id }, seed)
        await cancelOrderApi(order.item.id, 'WAVES', o)
        return {}
      }
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


main()
//3PKEQiRe2u6488jdvUAUYshrM4fQPf4omak