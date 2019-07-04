import { IOrder, ICancelOrder, IIssueTransaction, WithId, IDataTransaction } from '@waves/waves-transactions'
import { ICreateItemParamsV1, IItemV1, IDataPayloadV1, IEditItemParamsV1 } from './v1'
import { Versions } from './versions'

export interface IItemMap {
  1: IItemV1
  //2: IIItemV2
}

export type TItem = IItemV1 //| IItemV2

export interface IDataPayloadMap {
  1: IDataPayloadV1
  //2: IDataPayloadV2
}

export type TDataPayload = IDataPayloadV1 //|IDataPayloadV2

export interface ICreateParamsMap {
  1: ICreateItemParamsV1
  //2: ICreateItemParamsV2
}

export interface IEditParamsMap {
  1: IEditItemParamsV1
  //2: IEditItemParamsV2
}

export interface IUserInventory {
  items: { balance: number; item: TItem }[]
}

export interface IItemOrder {
  id: string
  type: 'buy' | 'sell'
  price: number
  item: TItem
}

export interface IPreview<T> {
  preview(seed?: string): Promise<T>
}

export interface IEntries<T> {
  entries(seed?: string): Promise<T>
}

export interface IBroadcast<T> {
  broadcast(seed?: string): Promise<T>
}

export type TIssue = IIssueTransaction & WithId & { sender: string }
export type TData = IDataTransaction & WithId & { sender: string }

export interface IWavesItemsApi {
  //Forging
  createItem<V extends Versions>(
    params: ICreateParamsMap[V],
  ): IPreview<IItemMap[V]> & IEntries<[TIssue, TData]> & IBroadcast<IItemMap[V]>
  //Editing
  editItem<V extends Versions>(
    params: IEditParamsMap[V],
  ): IPreview<IItemMap[V]> & IEntries<[TData]> & IBroadcast<IItemMap[V]>

  //Items and catalog
  getUserInventory(gameId: string, address: string): Promise<IUserInventory>
  getItemCatalog(gameId: string): Promise<TItem[]>
  getItem(itemId: string): Promise<TItem>

  //Trading
  buyItem(itemId: string, price: number): IEntries<IOrder> & IBroadcast<IItemOrder>
  sellItem(itemId: string, price: number): IEntries<IOrder> & IBroadcast<IItemOrder>
  cancelOrder(order: IItemOrder): IEntries<ICancelOrder> & IBroadcast<void>
}
