import { IVersion } from '../versions'

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
