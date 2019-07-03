import { TIssue, TItem } from './interface'
import { KeyValuePair, AssetInfo } from '@waves/waves-rest'
import { parseDataPayload } from './data-payload'
import { toInt } from './utils'

const oneOf = <A, B, T extends A[keyof A]>(obj: A | B, propA: keyof A, propB: keyof B) => ((obj as A)[propA] || (obj as B)[propB]) as T

export const parseItem = (issueTx: TIssue | AssetInfo, kvp: KeyValuePair): TItem => {
  const id = oneOf<TIssue, AssetInfo, string>(issueTx, 'id', 'assetId')
  const sender = oneOf<TIssue, AssetInfo, string>(issueTx, 'sender', 'issuer')
  const timestamp = oneOf<TIssue, AssetInfo, number>(issueTx, 'timestamp', 'issueTimestamp')

  if (id !== kvp.key) {
    throw new Error('Invalid Item.')
  }

  const { data, version } = parseDataPayload(kvp.value, 'throw')

  switch (version) {
    case 1:
      return {
        id: id,
        gameId: sender,
        quantity: toInt(issueTx.quantity),
        created: timestamp,
        ...data,
      }
    default:
      throw new Error(`Verison ${version} is not supported.`)
  }
}
