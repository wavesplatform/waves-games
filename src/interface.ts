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

export type TIntent<T> = {
  broadcast(seed: string): Promise<T>
  //keeper(): Promise<T>
}

export interface IWavesItems {
  //Forging
  createItem(params: TCreateItemParams): TIntent<TItem>

  //Items and catalog
  getUserItems(gameId: string, address: string): Promise<TItem[]>
  getItemCatalog(gameId: string): Promise<TItem[]>
  getItem(itemId: string): Promise<TItem>

  //Trading 
  buyItem(itemId: string, price: number): TIntent<TItemOrder>
  sellItem(itemId: string, price: number): TIntent<TItemOrder>
  cancelOrder(order: TItemOrder): TIntent<{}>
}
