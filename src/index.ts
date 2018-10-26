import { issue, data, burn, reissue, order } from 'waves-transactions'
import axios from 'axios'
import { Tx } from 'waves-transactions/transactions'
import { address } from 'waves-crypto'

export type Currency = 'WAVES' | 'BTC' | 'ETH'

export type Price = { value: number, assetId: string }


export type ItemParams = ItemParamsV1

export interface ItemParamsV1 {
  version: ParamsVer.One,
  main: { img: string, name: string },
  misc: any
}

export interface ItemDistribution {
  [address: string]: number
}

export interface BlockchainItem<T> {
  id: string,
  gameId: string,
  img: string,
  name: string,
  amount: number,
  isLimited: boolean,
  timestamp?: number
  misc: T,

  rawParams: ItemParams

  itemDistribution?: ItemDistribution
}

export interface AssetInfo {
  assetId: string,
  issueHeight: number,
  issueTimestamp: number,
  issuer: string,
  name: string,
  description: string,
  decimals: number,
  reissuable: boolean,
  quantity: number,
}

const isArray = <T>(arg: T | T[] | Array<T> | ArrayLike<T>): arg is T[] => (<T[]>arg).length != undefined ? true : false

export type Either<TResult = any, TError = any> = Result<TResult> | Error<TError>

export interface Result<TResult = any> {
  success: boolean, result: TResult
}

export interface Error<TError = any> {
  success: boolean,
  error: TError
}

const toEither = <TResult, TError>(condition: boolean, result: TResult, error: TError): Either<TResult, TError> => {
  const either: Partial<Either> = { success: condition }
  condition ?
    either['result'] = result :
    either['error'] = error

  return either as Either<TResult, TError>
}

const toResult = async <TResult = any, TError = any>(promise: Promise<TResult> | (() => Promise<TResult>)): Promise<Either<TResult, TError>> => {

  const safeInvoke = (func: () => Promise<TResult>) => {
    try {
      return func()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const p = typeof promise == 'function' ?
    safeInvoke(promise) : promise

  const either = (await p
    .then(result => ({ success: true, result }))
    .catch(error => ({ success: false, error }))) as Either<TResult, TError>

  return either
}

export enum ParamsVer { One }

export const isResult = <Tresult, TError>(either: Either<Tresult, TError>): either is Result<Tresult> => either ? either.success : false

export interface SuplyInfo {
  oldSuply: number, newSuply: number
}

export type ItemsForSale = { amount: number, price: number }[]

export interface Err {
  txExecutionDetails: Either[]
}

export interface IWavesItems {
  create: (seed: string, amount: number, isLimited: boolean, params: ItemParams) => Promise<Either<BlockchainItem<any>, Err>>
  getItemInfo: (id: string, includeDistribution: boolean) => Promise<Either<BlockchainItem<any>, Err>>
  changeSuply: (seed: string, id: string, amountChange: number) => Promise<Either<SuplyInfo, Err>>
  freezeSuply: (seed: string, id: string) => Promise<Either<boolean, Err>>
  getItemList: (creatorAddress: string) => Promise<Either<BlockchainItem<any>[], Err>>
  sellItem: (seed: string, itemId: string, price: Price, amount: number) => Promise<Either<{}, Err>>
  buyItem: (seed: string, itemId: string, price: Price, amount: number) => Promise<Either<{}, Err>>
  waves(value: number): Price
  btc(value: number): Price
  eth(value: number): Price
  itemsForSale(itemId: string, currency: Currency): Promise<Either<any, Err>>
}



export function WavesItems(chainId: 'W' | 'T'): IWavesItems {
  const nodeUri = chainId == 'T' ? 'https://testnodes.wavesnodes.com' : 'https://nodes.wavesnodes.com'
  const matcherUri = chainId == 'T' ? 'https://testnodes.wavesnodes.com/matcher' : 'https://matcher.wavesplatform.com/matcher'
  const matcher = chainId == 'T' ? '8QUAqtTckM5B8gvcuP7mMswat9SjKUuafJMusEoSn1Gy' : '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy'

  const btcId = chainId == 'T' ? 'DWgwcZTMhSvnyYCoWLRUXXSH1RSkzThXLJhww9gwkqdn' : '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
  const ethId = chainId == 'T' ? 'BrmjyAWT5jjr3Wpsiyivyvg5vDuzoX2s93WgiexXetB3' : '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu'

  const currencies: { readonly [c in Currency]: string } = {
    BTC: btcId,
    ETH: ethId,
    WAVES: 'WAVES'
  }


  const broadcast = async (tx: Tx | Tx[]): Promise<Either[]> =>
    Promise.all((isArray(tx) ? tx : [tx]).map(tx => toResult(axios.post(`${nodeUri}/transactions/broadcast`, tx).then(x => x.data))))

  async function create<T = any>(seed: string, amount: number, isLimited: boolean, params: ItemParams): Promise<Either<BlockchainItem<T>, Err>> {
    const issueTx = issue(seed, {
      decimals: 0,
      quantity: amount,
      reissuable: !isLimited,
      description: ``,
      name: 'ITEM',
      chainId,
    })

    const dataTx = data(seed, {
      data: [{
        key: issueTx.id,
        value: JSON.stringify(params)
      }]
    })

    const result = await broadcast([issueTx, dataTx])

    return toEither(result.every(r => r.success), ({
      id: issueTx.id,
      gameId: address(seed, chainId),
      name: params.main.name,
      img: params.main.img,
      amount: issueTx.quantity,
      isLimited: !issueTx.reissuable,
      misc: params.misc,
      rawParams: params,
    }), { txExecutionDetails: result })
  }

  function buildItemInfo<T = any>(issueTx: AssetInfo, itemParams: ItemParams): BlockchainItem<T> {
    const { name, img } = itemParams.main
    return {
      id: issueTx.assetId,
      gameId: issueTx.issuer,
      name,
      img,
      amount: issueTx.quantity,
      isLimited: !issueTx.reissuable,
      misc: itemParams.misc,
      rawParams: itemParams,
      timestamp: issueTx.issueTimestamp
    }
  }

  async function getItemInfo<TItemMisc = any>(id: string, includeDistribution: boolean = false): Promise<Either<BlockchainItem<TItemMisc>, Err>> {
    try {
      const issueTx = await axios.get(`${nodeUri}/assets/details/${id}`).then(x => x.data) as AssetInfo
      const itemParams = JSON.parse(await axios.get(`${nodeUri}/addresses/data/${issueTx.issuer}/${id}`).then(x => x.data.value)) as ItemParams

      const itemDistribution = !includeDistribution ? undefined :
        await axios.get(`${nodeUri}/assets/${id}/distribution`).then(x => x.data) as ItemDistribution

      const item = buildItemInfo(issueTx, itemParams)

      return {
        success: true, result: {
          ...item,
          itemDistribution,
        }
      }
    } catch (error) {
      return { success: false, error }
    }
  }

  async function getItemList<TItemMisc = any>(issuerId: string): Promise<Either<BlockchainItem<TItemMisc>[], Err>> {
    try {
      const dataTransactions = await axios.get(`${nodeUri}/addresses/data/${issuerId}`).then(x => x.data) as any[]
      const items = await Promise.all(dataTransactions.map(x =>
        toResult(() => axios.get(`${nodeUri}/assets/details/${x.key}`).then(y => ({ issueTx: y.data, itemParams: JSON.parse(x.value) })))
      ))
      return { success: true, result: items.filter(isResult).map(x => buildItemInfo(x.result.issueTx, x.result.itemParams)) }
    } catch (error) {
      return { success: false, error }
    }
  }

  async function sellItem(seed: string, itemId: string, price: Price, amount: number = 1): Promise<Either<{}, Err>> {
    const o = order(seed, {
      amount,
      price: price.value,
      matcherPublicKey: matcher,
      orderType: 'sell',
      amountAsset: itemId,
      priceAsset: price.assetId
    })

    const r = await toResult(axios.post(`${matcherUri}/orderbook`, o).then(x => x.data))
    return r
  }

  async function buyItem(seed: string, itemId: string, price: Price, amount: number = 1): Promise<Either<{}, Err>> {
    const o = order(seed, {
      amount,
      price: price.value,
      matcherPublicKey: matcher,
      orderType: 'buy',
      amountAsset: itemId,
      priceAsset: price.assetId
    })

    const r = await toResult(axios.post(`${matcherUri}/orderbook`, o).then(x => x.data))
    return r
  }

  async function itemsForSale(itemId: string, currency: Currency): Promise<Either<ItemsForSale, Err>> {
    interface rp { asks: { "amount": number, "price": number }[] }
    const uri = `${matcherUri}/orderbook/${itemId}/${currencies[currency]}`

    return await toResult(axios.get(uri).then(x => x.data as rp).then(x => x.asks.map(a => ({ amount: a.amount, price: a.price / Math.pow(10, 8) }))))
  }

  async function freezeSuply(seed: string, itemId: string): Promise<Either<boolean, Err>> {
    const itemInfo = await getItemInfo(itemId, true)

    if (!isResult(itemInfo))
      return itemInfo

    const tx = reissue(seed, { assetId: itemId, quantity: 0, reissuable: false, chainId })

    const r = await broadcast(tx).then(x => x[0])

    if (!isResult(r))
      return { success: false, error: { txExecutionDetails: [r] } }

    return { success: true, result: true }
  }

  async function changeSuply(seed: string, id: string, amountChange: number): Promise<Either<SuplyInfo, Err>> {
    const itemInfo = await getItemInfo(id, true)

    if (!isResult(itemInfo))
      return itemInfo

    const result = amountChange < 0 ?
      burn(seed, { assetId: id, quantity: -amountChange, chainId }) :
      reissue(seed, { assetId: id, quantity: amountChange, reissuable: !itemInfo.result.isLimited, chainId })

    const r = await broadcast(result).then(x => x[0])

    if (!isResult(r))
      return { success: false, error: { txExecutionDetails: [r] } }

    return { success: true, result: { oldSuply: itemInfo.result.amount, newSuply: itemInfo.result.amount + amountChange } }
  }

  const waves = (value: number): Price => ({ value: value * Math.pow(10, 8), assetId: null })
  const btc = (value: number): Price => ({ value: value * Math.pow(10, 8), assetId: btcId })
  const eth = (value: number): Price => ({ value: value * Math.pow(10, 8), assetId: ethId })

  return {
    create,
    changeSuply,
    freezeSuply,
    getItemInfo,
    getItemList,
    sellItem,
    buyItem,
    waves,
    btc,
    eth,
    itemsForSale
  }
}