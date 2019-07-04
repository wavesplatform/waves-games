import { Versions } from 'versions'
import { IParamMap, TIssue, TData } from 'interface'
import { TChainId } from '@waves/waves-crypto'
import { txsForItemV1Create } from 'v1'

// export const txsForItemV1Create = (params: ICreateItemParamsV1, chainId: TChainId, seed: string): [TIssue, TData] => {
//   const payload: IDataPayloadV1 = {
//     version: params.version,
//     name: params.name,
//     imageUrl: params.imageUrl,
//     misc: params.misc,
//   }

//   const jsonPayload = JSON.stringify(payload)
//   parseDataPayload(jsonPayload, 'throw')

//   const i = {
//     sender: address(seed, chainId),
//     ...issue(
//       { quantity: params.quantity, reissuable: false, chainId, decimals: 0, name: 'ITEM', description: '' },
//       seed,
//     ),
//   }

//   const d = {
//     sender: address(seed, chainId),
//     ...data({ data: [{ key: i.id, value: jsonPayload }] }, seed),
//   }

//   return [i, d]
// }

export const txsForItemCreate = <V extends Versions>(
  params: IParamMap[V],
  chainId: TChainId,
  seed: string = undefined,
): [TIssue, TData] => {
  switch (params.version) {
    case 1:
      return txsForItemV1Create(params, chainId, seed ? seed : '')
    default:
      throw new Error(`Vertion ${params.version} is not supported`)
  }
}
