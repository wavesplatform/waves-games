import { TTx } from '@waves/waves-transactions'
import './extensions'

export const toInt = (value: string | number) => typeof value === 'number' ? value : parseInt(value)

export const totalFee = (...txs: (TTx[] | TTx)[]): number =>
  txs.map(x => <TTx[]>((<any[]>x).length ? x : [x])).flat().sum(x => toInt(x.fee))

export const formatWaves = (wavelets: number) => wavelets / Math.pow(10, 8)
