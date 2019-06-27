import { TTx, IOrder, ICancelOrder, IIssueTransaction, WithId, IDataTransaction } from '@waves/waves-transactions'

export type TItemMisc = Record<string, number | string | object>

export type TCreateItemParams = {
  version: number
  name: string
  imageUrl: string
  quantity: number
  misc: TItemMisc
}

export type TItem = {
  id: string
  gameId: string
  name: string
  imageUrl: string
  quantity: number
  misc: TItemMisc
  created: number
}

export type TItemOrder = {
  id: string
  type: 'buy' | 'sell'
  price: number
  item: TItem
}

export type TIntent<T, TEntries> = {
  entries(seed: string): TEntries
  result(seed: string): T
  broadcast(seed: string): Promise<T>
  //keeper(): Promise<T>
}

export type TItarableIntent<T, TEntries> = {
  entries(seed: string): TEntries
  broadcast(seed: string): AsyncIterableIterator<T>
}

export interface IWavesItems {
  //Forging
  createItem(params: TCreateItemParams): TIntent<TItem, [IIssueTransaction & WithId, IDataTransaction & WithId]>

  //Items and catalog
  getUserItems(gameId: string, address: string): Promise<TItem[]>
  getItemCatalog(gameId: string): Promise<TItem[]>
  getItem(itemId: string): Promise<TItem>

  //Trading 
  buyItem(itemId: string, price: number): TIntent<TItemOrder, IOrder>
  sellItem(itemId: string, price: number): TIntent<TItemOrder, IOrder>
  cancelOrder(order: TItemOrder): TIntent<{}, ICancelOrder>
}
