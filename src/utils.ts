import { TTx } from '@waves/waves-transactions'
import './extensions'

export const urlRegexp = new RegExp(
  '^(https?:\\/\\/)?' + // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', // fragment locator
  'i',
)

export const isString = (val: any): val is string => typeof val === 'string' || val instanceof String

export const isUint8Array = (val: any): val is Uint8Array => val instanceof Uint8Array

export const isArray = (val: any): val is any[] => val instanceof Array

export const isValidUrl = (str: string): boolean => urlRegexp.test(str)

export const toInt = (value: string | number) => (typeof value === 'number' ? value : parseInt(value))

export const totalFee = (...txs: (TTx[] | TTx)[]): number =>
  txs
    .map(x => (isArray(x) ? x : [x]))
    .flat()
    .sum(x => toInt(x.fee))

export const formatWaves = (wavelets: number) => wavelets / Math.pow(10, 8)
