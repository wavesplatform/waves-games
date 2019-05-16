export type Currency = 'WAVES' | 'BTC' | 'ETH'
export type Price = { value: number, assetId: string }

export interface Distribution {
  [address: string]: number
}

export interface Intent<T> {
  entries: any[],
  execute: () => Promise<T>
}

export enum ChainId {
  Mainnet = 'W',
  Testnet = 'T'
}

export interface ItemDetails {
  key: string,
  value: any,
  type?: string
}

export interface ItemParams<T = any> {
  version: number,
  imageUrl: string,
  name: string,
  misc: T | undefined
}

export interface ItemCreateParams<T = any> extends ItemParams<T> {
  amount: number
  isLimited: boolean
}

export interface ItemDistribution {
  [address: string]: number
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
  quantity: string | number,
}

export type AmountPricePair = {
  amountAsset: string,
  priceAsset: string
}

export interface OrderbookPair {
  pair: AmountPricePair,
  bids: { amount: number, price: number }[],
  asks: { amount: number, price: number }[]
}

export interface OrderData {
  sender: string,
  orderId: string,
  signature: string
}