import { issue, data, burn, reissue } from 'waves-transactions'
import axios from 'axios'
import { Tx, } from 'waves-transactions/transactions'


type ItemParams = ItemParamsV1

interface ItemParamsV1 {
  version: ParamsVer.One,
  main: { img: string, name: string },
  misc: any
}

interface ItemDistribution {
  [address: string]: number
}

interface BlockchainItem<T> {
  id: string,
  img: string,
  name: string,
  amount: number,
  isLimited: boolean,
  timestamp?: number
  misc: T,

  rawParams: ItemParams

  itemDistribution?: ItemDistribution
}

const isArray = <T>(arg: T | T[] | Array<T> | ArrayLike<T>): arg is T[] => (<T[]>arg).length != undefined ? true : false

type Either<TResult = any, TError = any> = Result<TResult> | Error<TError>

interface Result<TResult = any> {
  success: boolean, result: TResult
}

interface Error<TError = any> {
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

const toResult = async <TResult = any, TError = any>(promise: Promise<TResult>): Promise<Either<TResult, TError>> => {
  const either = (await promise
    .then(result => ({ success: true, result }))
    .catch(error => ({ success: false, error }))) as Either<TResult, TError>

  return either
}

export enum ParamsVer { One }

export const isResult = <Tresult, TError>(either: Either<Tresult, TError>): either is Result<Tresult> => either.success

export interface SuplyInfo {
  oldSuply: number, newSuply: number
}

export interface Err {
  txExecutionDetails: Either[]
}

export function WavesItems(chainId: 'W' | 'T') {

  const baseUri = chainId == 'T' ? 'https://testnodes.wavesnodes.com' : 'https://nodes.wavesnodes.com'

  const broadcast = async (tx: Tx | Tx[]): Promise<Either[]> =>
    Promise.all((isArray(tx) ? tx : [tx]).map(tx => toResult(axios.post(`${baseUri}/transactions/broadcast`, tx).then(x => x.data))))

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
      name: params.main.name,
      img: params.main.img,
      amount: issueTx.quantity,
      isLimited: !issueTx.reissuable,
      misc: params.misc,
      rawParams: params,
    }), { txExecutionDetails: result })
  }

  async function getItemInfo<T = any>(id: string, includeDistribution: boolean = false): Promise<Either<BlockchainItem<T>, Err>> {
    try {
      const issueTx = await axios.get(`${baseUri}/assets/details/${id}`).then(x => x.data)
      const itemParams = JSON.parse(await axios.get(`${baseUri}/addresses/data/${issueTx.issuer}/${id}`).then(x => x.data.value)) as ItemParams

      const { name, img } = itemParams.main

      const itemDistribution = !includeDistribution ? undefined :
        await axios.get(`${baseUri}/assets/${id}/distribution`).then(x => x.data) as ItemDistribution

      return {
        success: true, result: {
          id,
          name,
          img,
          amount: issueTx.quantity,
          isLimited: !issueTx.reissuable,
          misc: itemParams.misc,
          rawParams: itemParams,
          itemDistribution,
          timestamp: issueTx.issueTimestamp
        }
      }
    } catch (error) {
      return { success: false, error }
    }

  }

  async function changeSuply(seed: string, id: string, amountChange: number): Promise<Either<SuplyInfo, Err>> {
    const itemInfo = await getItemInfo(id, true)

    if (!isResult(itemInfo))
      return itemInfo

    const result = amountChange < 0 ?
      await burn(seed, { assetId: id, quantity: -amountChange, chainId }) :
      await reissue(seed, { assetId: id, quantity: amountChange, reissuable: !itemInfo.result.isLimited, chainId })

    const r = await broadcast(result).then(x => x[0])

    if (!isResult(r))
      return { success: false, error: { txExecutionDetails: [r] } }

    return { success: true, result: { oldSuply: itemInfo.result.amount, newSuply: itemInfo.result.amount + amountChange } }
  }

  return {
    create,
    changeSuply,
    getItemInfo
  }
}