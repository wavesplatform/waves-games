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

export interface IEditItemParamsV1 extends IVersion<1> {
  itemId: string
  name: string
  imageUrl: string
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

const createItemV1Payload = (params: ICreateItemParamsV1 | IEditItemParamsV1) => {
  const payload = {
    version: params.version,
    name: params.name,
    imageUrl: params.imageUrl,
    misc: params.misc,
  }

  const jsonPayload = JSON.stringify(payload)
  parseDataPayload(jsonPayload, 'throw')

  return { payload, jsonPayload }
}

export const txsForItemV1Create = (
  params: ICreateItemParamsV1,
  chainId: TChainId,
  senderPublicKey: string,
  seed: string,
): [TIssue, TData] => {
  const { jsonPayload } = createItemV1Payload(params)

  const i = {
    sender: address(seed, chainId),
    ...issue(
      {
        quantity: params.quantity,
        reissuable: false,
        chainId,
        decimals: 0,
        name: 'ITEM',
        description: '',
        senderPublicKey,
      },
      seed,
    ),
  }

  const d = {
    sender: address(seed, chainId),
    ...data({ data: [{ key: i.id, value: jsonPayload }], senderPublicKey }, seed),
  }

  return [i, d]
}

export const txsForItemV1Edit = (
  params: IEditItemParamsV1,
  chainId: TChainId,
  senderPublicKey: string,
  seed: string,
): [TData] => {
  const { jsonPayload } = createItemV1Payload(params)

  const d = {
    sender: address(seed, chainId),
    ...data({ data: [{ key: params.itemId, value: jsonPayload }], senderPublicKey }, seed),
  }

  return [d]
}
