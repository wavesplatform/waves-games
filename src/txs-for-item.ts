import { Versions } from './versions'
import { ICreateParamsMap, IEditParamsMap, TIssue, TData } from './interface'
import { TChainId } from '@waves/waves-crypto'
import { txsForItemV1Create, txsForItemV1Edit } from './v1'

export const txsForItemCreate = <V extends Versions>(
  params: ICreateParamsMap[V],
  chainId: TChainId,
  senderPublicKey: string,
  seed: string = undefined,
): [TIssue, TData] => {
  switch (params.version) {
    case 1:
      return txsForItemV1Create(params, chainId, senderPublicKey, seed ? seed : '')
    default:
      throw new Error(`Vertion ${params.version} is not supported`)
  }
}

export const txsForItemEdit = <V extends Versions>(
  params: IEditParamsMap[V],
  chainId: TChainId,
  senderPublicKey: string,
  seed: string = undefined,
): [TData] => {
  switch (params.version) {
    case 1:
      return txsForItemV1Edit(params, chainId, senderPublicKey, seed ? seed : '')
    default:
      throw new Error(`Vertion ${params.version} is not supported`)
  }
}
