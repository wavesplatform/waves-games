import { TSeedTypes } from '@waves/waves-transactions'

export type LONG = string | number
export type Currency = 'WAVES' | 'BTC' | 'ETH'
export type Price = {
  value: number,
  assetId: string,
}

export enum ChainId {
  Mainnet = 'W',
  Testnet = 'T',
}

export interface ClientOptions {
  seed: TSeedTypes,
  chainId: ChainId,
}

export interface ItemParams<T> {
  version: number,
  name: string
  imageUrl: string,
  misc: T,
}

export interface ItemDetails {
  key: string,
  value: ItemParams<any>,
}

export interface Item<T = any> {
  id: string,
  name: string,
  quantity: LONG,
  gameId: string,
  imageUrl: string,
  reissuable: boolean,
  timestamp?: number
  misc: T,
  rawParams: ItemParams<T>,
}

export interface IOrderData {
  sender: string,
  orderId: string,
  signature: string
}

export interface IAssetInfo {
  assetId: string,
  issueHeight: number,
  issueTimestamp: number,
  issuer: string,
  name: string,
  description: string,
  decimals: number,
  reissuable: boolean,
  quantity: LONG,
}
