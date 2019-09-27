import {
  IWavesItemsApi,
  TItem,
  ICreateParamsMap,
  IEditParamsMap,
  IItemMap,
  TIssue,
  TData,
  IUserInventory,
  IPreview,
  IEntries,
  IBroadcast,
  TInvokeScript,
  IItemLot,
} from './interface'
import { TChainId, ChaidId, publicKey, base58Decode, base64Encode, address, base64Decode } from '@waves/ts-lib-crypto'
import { wavesApi, config, axiosHttp } from '@waves/waves-rest'
import './extensions'
import axios from 'axios'
import memoizee from 'promise-memoize'
import { IItemV1 } from './v1'
import { parseItem } from './parse-item'
import { Versions } from './versions'
import { toInt } from './utils'
import { signWithKeeper } from './keeper'
import { txsForItemCreate, txsForItemEdit } from './txs-for-item'
import { invokeScript } from '@waves/waves-transactions'
import { base58Encode } from '@waves/ts-lib-crypto'
import BigNumber from '@waves/bignumber'

declare const WavesKeeper: any

const wavesAssetId = '11111111111111111111111111111111'

export const wavesItemsApi = (chainId: TChainId, dApp?: string): IWavesItemsApi => {
  const cfg = ChaidId.isMainnet(chainId) ? config.mainnet : config.testnet

  dApp =
    dApp || (ChaidId.isMainnet(chainId) ? '3PJYvHqNcUsfQyPkvVCYMqYsi1xZKLmKT6k' : '3MrDcz4LFFjPhXdtu7YCqFSnHc3pD1tcWLa')

  const {
    broadcast,
    getIssueTxs,
    getKeyValuePairs,
    getAssetsBalance,
    getNftBalance,
    getAssetInfo,
    getValueByKey,
  } = wavesApi(cfg, axiosHttp(axios))

  const createItem = <V extends Versions>(
    params: ICreateParamsMap[V],
  ): IPreview<IItemMap[V]> & IEntries<[TIssue, TData]> & IBroadcast<IItemMap[V]> => {
    const txs = memoizee(
      async (seed?: string): Promise<[TIssue, TData]> => {
        seed = seed ? seed : ''
        let senderPublicKey = publicKey(seed)
        if (!seed) {
          senderPublicKey = (await WavesKeeper.publicState()).account.publicKey
        }
        const txs = txsForItemCreate(params, chainId, senderPublicKey, seed)

        if (!seed) {
          return (await signWithKeeper(txs)) as [TIssue, TData]
        }
        return txs
      },
    )

    const preview = async (seed?: string): Promise<IItemMap[V]> => {
      const [issue, data] = await txs(seed)
      return parseItem(issue, data)
    }

    return {
      entries: txs,
      preview,
      broadcast: async (seed?: string): Promise<IItemV1> => {
        const [issue, data] = await txs(seed)
        await Promise.all([broadcast(issue), broadcast(data)])
        return preview(seed)
      },
    }
  }

  const editItem = <V extends Versions>(
    params: IEditParamsMap[V],
  ): IPreview<IItemMap[V]> & IEntries<[TData]> & IBroadcast<IItemMap[V]> => {
    const txs = memoizee(
      async (seed?: string): Promise<[TData]> => {
        seed = seed ? seed : ''
        let senderPublicKey = publicKey(seed)
        if (!seed) {
          //TODO: remove this
          senderPublicKey = (await WavesKeeper.publicState()).account.publicKey
        }
        const txs = txsForItemEdit(params, chainId, senderPublicKey, seed)

        if (!seed) {
          return (await signWithKeeper(txs)) as [TData]
        }
        return txs
      },
    )

    const preview = async (seed?: string): Promise<IItemMap[V]> => {
      const [data] = await txs(seed)
      const info = await getAssetInfo(params.itemId)
      return parseItem(info, data)
    }

    return {
      entries: txs,
      preview,
      broadcast: async (seed?: string): Promise<IItemV1> => {
        const [issue] = await txs(seed)
        await Promise.all([broadcast(issue)])
        return preview(seed)
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
    const [assets, nfts] = await Promise.all([getAssetsBalance(address), getNftBalance(address)])

    const balances = assets.balances
      .map(({ assetId, balance }) => ({ assetId, balance }))
      .concat(nfts.map(x => ({ assetId: x.assetId, balance: 1 })))

    const i = (await getItemCatalog(gameId)).toRecord(x => x.id)
    const items = balances
      .filter(({ assetId }) => i[assetId])
      .map(({ balance, assetId }) => ({ balance: toInt(balance), item: i[assetId] }))
    return { items }
  }

  const getItem = async (itemId: string): Promise<TItem> => {
    const info = await getAssetInfo(itemId)
    const { value } = await getValueByKey(info.issuer, info.assetId)

    return parseItem(info, { key: info.assetId, value, type: 'string' })
  }

  const sell = (
    assetId: string,
    amount: number,
    priceAsset: string,
    price: number,
  ): IEntries<TInvokeScript> & IBroadcast<TInvokeScript> => {
    const entries = memoizee(
      async (seed?: string): Promise<TInvokeScript> => {
        seed = seed ? seed : ''
        let senderPublicKey = publicKey(seed)
        if (!seed) {
          //TODO: remove this
          senderPublicKey = (await WavesKeeper.publicState()).account.publicKey
        }

        if (!priceAsset || 'WAVES') priceAsset = wavesAssetId

        const tx = invokeScript(
          {
            call: {
              function: 'sell',
              args: [
                {
                  type: 'integer',
                  value: price,
                },
                {
                  type: 'binary',
                  value: 'base64:' + base64Encode(base58Decode(priceAsset)),
                },
              ],
            },
            dApp,
            payment: [{ amount, assetId }],
            chainId: cfg.chainId,
          },
          seed,
        )

        if (!seed) {
          return ((await signWithKeeper([tx])) as [TInvokeScript])[0]
        }
        return { sender: address({ publicKey: senderPublicKey }, chainId), ...tx }
      },
    )

    return {
      entries,
      broadcast: async (seed?: string): Promise<TInvokeScript> => {
        const tx = await entries(seed)
        await broadcast(tx)
        return tx
      },
    }
  }

  const buy = (lotId: string, amount: number): IEntries<TInvokeScript> & IBroadcast<TInvokeScript> => {
    const entries = memoizee(
      async (seed?: string): Promise<TInvokeScript> => {
        seed = seed ? seed : ''
        let senderPublicKey = publicKey(seed)
        if (!seed) {
          //TODO: remove this
          senderPublicKey = (await WavesKeeper.publicState()).account.publicKey
        }

        const { value } = await getValueByKey(dApp, lotId)
        const bytes = base64Decode(value.replace('base64:', ''))
        const price = BigNumber.fromBytes(bytes.slice(0, 8)).toNumber()
        const assetId = base58Encode(bytes.slice(8 + 8, 8 + 8 + 32))

        const tx = invokeScript(
          {
            call: {
              function: 'buy',
              args: [
                {
                  type: 'string',
                  value: lotId,
                },
                {
                  type: 'integer',
                  value: amount,
                },
              ],
            },
            dApp,
            payment: [{ amount: price * amount, assetId: assetId === wavesAssetId ? null : assetId }],
            chainId: cfg.chainId,
          },
          seed,
        )

        if (!seed) {
          return ((await signWithKeeper([tx])) as [TInvokeScript])[0]
        }
        return { sender: address({ publicKey: senderPublicKey }, chainId), ...tx }
      },
    )

    return {
      entries,
      broadcast: async (seed?: string): Promise<TInvokeScript> => {
        const tx = await entries(seed)
        await broadcast(tx)
        return tx
      },
    }
  }

  const cancel = (lotId: string): IEntries<TInvokeScript> & IBroadcast<TInvokeScript> => {
    const entries = memoizee(
      async (seed?: string): Promise<TInvokeScript> => {
        seed = seed ? seed : ''
        let senderPublicKey = publicKey(seed)
        if (!seed) {
          //TODO: remove this
          senderPublicKey = (await WavesKeeper.publicState()).account.publicKey
        }

        const tx = invokeScript(
          {
            call: {
              function: 'cancel',
              args: [
                {
                  type: 'string',
                  value: lotId,
                },
              ],
            },
            dApp,
            payment: [],
            chainId: cfg.chainId,
          },
          seed,
        )

        if (!seed) {
          return ((await signWithKeeper([tx])) as [TInvokeScript])[0]
        }
        return { sender: address({ publicKey: senderPublicKey }, chainId), ...tx }
      },
    )

    return {
      entries,
      broadcast: async (seed?: string): Promise<TInvokeScript> => {
        const tx = await entries(seed)
        await broadcast(tx)
        return tx
      },
    }
  }

  const getAllLots = async (): Promise<IItemLot[]> => {
    const pairs = await getKeyValuePairs(dApp)
    return pairs.map(({ key, value }) => {
      const bytes = base64Decode(value.replace('base64:', ''))
      const price = BigNumber.fromBytes(bytes.slice(0, 8)).toNumber()
      const stock = BigNumber.fromBytes(bytes.slice(8, 8 + 8)).toNumber()
      const assetId = base58Encode(bytes.slice(8 + 8, 8 + 8 + 32))
      const priceAsset = assetId === wavesAssetId ? 'WAVES' : assetId
      const amountAsset = base58Encode(bytes.slice(8 + 8 + 32, 8 + 8 + 32 + 32))
      const seller = address({ publicKey: bytes.slice(8 + 8 + 32 + 32, 8 + 8 + 32 + 32 + 32) }, chainId)
      return { id: key, price, stock, priceAsset, amountAsset, seller }
    })
  }

  return {
    createItem,
    editItem,
    getItem,
    getUserInventory,
    getItemCatalog,
    sell,
    buy,
    cancel,
    getAllLots,
  }
}
