import { IVersion } from '../versions'
import { TIssue, TData } from '../interface'
import { parseDataPayload } from '../data-payload'
import { address, TChainId } from '@waves/waves-crypto'
import { issue, data } from '@waves/waves-transactions'

export type TItemMiscV1 = Record<string, number | string | boolean>

export interface IDataPayloadV1 extends IVersion<1> {
  name: string
  imageUrl: string
  misc: TItemMiscV1
}

export interface ICreateItemParamsV1 extends IVersion<1> {
  name: string
  imageUrl: string
  quantity: number
  misc?: TItemMiscV1
}

export interface IItemV1 extends IVersion<1> {
  id: string
  gameId: string
  name: string
  imageUrl: string
  quantity: number
  misc: TItemMiscV1
  created: number
}

export const txsForItemV1Create = (params: ICreateItemParamsV1, chainId: TChainId, seed: string): [TIssue, TData] => {
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
    ...issue(
      { quantity: params.quantity, reissuable: false, chainId, decimals: 0, name: 'ITEM', description: '' },
      seed,
    ),
  }

  const d = {
    sender: address(seed, chainId),
    ...data({ data: [{ key: i.id, value: jsonPayload }] }, seed),
  }

  return [i, d]
}
