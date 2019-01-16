import axios from 'axios'
import { AssetInfo, OrderData, ItemDetails, OrderbookPair, ItemParams, ItemDistribution } from 'types'
import { IOrder } from '@waves/waves-transactions'

export const getAssetInfo = (id: string, apiBase: string): Promise<AssetInfo> => {
  return new Promise<AssetInfo>((resolve, reject) => {
    axios.get(`assets/details/${id}`, { baseURL: apiBase })
      .then(r => resolve(r.data))
      .catch(e => reject(e.response && e.response.status === 400 ? new Error(e.response.data.message) : e))
  })
}

export const getItemParams = (issuer: string, id: string, apiBase: string): Promise<ItemParams> => {
  return new Promise<ItemParams>((resolve, reject) => {
    axios.get(`addresses/data/${issuer}/${id}`, { baseURL: apiBase })
      .then(r => resolve(JSON.parse(r.data.value)))
      .catch(e => reject(e.response && e.response.status === 400 ? new Error(e.response.data.message) : e))
  })
}

export const getItemDistribution = (id: string, apiBase: string): Promise<ItemDistribution> => {
  return new Promise<ItemDistribution>((resolve, reject) => {
    axios.get(`assets/${id}/distribution`, { baseURL: apiBase })
      .then(r => resolve(r.data))
      .catch(e => reject(e.response && e.response.status === 400 ? new Error(e.response.data.message) : e))
  })
}

export const getItemDetailsList = (issuer: string, apiBase: string): Promise<ItemDetails[]> => {
  return new Promise<ItemDetails[]>((resolve, reject) => {
    axios.get(`addresses/data/${issuer}`, { baseURL: apiBase })
      .then(r => resolve(r.data))
      .catch(e => reject(e.response && e.response.status === 400 ? new Error(e.response.data.message) : e))
  })
}

export const getOrderbookPair = (amountAsset: string, priceAsset: string, matcherApiBase: string): Promise<OrderbookPair> => {
  return new Promise<OrderbookPair>((resolve, reject) => {
    axios.get(`orderbook/${amountAsset}/${priceAsset}`, { baseURL: matcherApiBase })
      .then(r => resolve(r.data))
      .catch(e => reject(e.response && e.response.status === 400 ? new Error(e.response.data.message) : e))
  })
}

export const createOrder = (order: IOrder, matcherApiBase: string): Promise<IOrder> => {
  return new Promise<IOrder>((resolve, reject) => {
    axios.post('orderbook', order, { baseURL: matcherApiBase })
      .then(r => resolve(r.data))
      .catch(e => reject(e.response && e.response.status === 400 ? new Error(e.response.data.message) : e))
  })
}

export const cancelOrder = (orderData: OrderData, matcherApiBase: string): Promise<IOrder> => {
  return new Promise<IOrder>((resolve, reject) => {
    axios.post('orderbook/cancel', orderData, { baseURL: matcherApiBase })
      .then(r => resolve(r.data))
      .catch(e => reject(e.response && e.response.status === 400 ? new Error(e.response.data.message) : e))
  })
}