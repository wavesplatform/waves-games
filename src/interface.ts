import { IIssueTransaction, WithId, IDataTransaction, IInvokeScriptTransaction } from '@waves/waves-transactions'
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

export interface IItemLot {
  id: string
  amountAsset: string
  priceAsset: string
  stock: number
  price: number
  seller: string
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
export type TInvokeScript = IInvokeScriptTransaction & WithId & { sender: string }

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
  sell(
    assetId: string,
    amount: number,
    priceAsset: string,
    price: number,
  ): IEntries<TInvokeScript> & IBroadcast<TInvokeScript>
  buy(lotId: string, amount: number): IEntries<TInvokeScript> & IBroadcast<TInvokeScript>
  cancel(lotId: string): IEntries<TInvokeScript> & IBroadcast<TInvokeScript>
  getAllLots(): Promise<IItemLot[]>
}
