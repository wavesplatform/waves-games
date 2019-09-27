import { TTx } from '@waves/waves-transactions'

declare const WavesKeeper: any

export const signWithKeeper = async (txs: TTx[]): Promise<TTx[]> => {
  if (!WavesKeeper) {
    throw new Error('Waves keeper is not installed.')
  }

  const map = (x: any) => {
    delete x.proofs
    delete x.senderPublicKey
    return {
      type: x.type.valueOf(),
      data: {
        ...x,
        precision: x.decimals || x.decimals === 0 ? x.decimals : undefined,
        fee: { assetId: 'WAVES', coins: x.fee },
        amount: x['amount'] ? { assetId: 'WAVES', coins: x['amount'] } : undefined,
      },
    } as any
  }

  const r = await (txs.length == 1
    ? WavesKeeper.signTransaction(map(txs[0]))
    : WavesKeeper.signTransactionPackage(txs.map(map)))

  return txs.map((x, i) => {
    const { proofs, senderPublicKey } = JSON.parse(typeof r === 'string' ? r : r[i])
    return {
      ...x,
      proofs,
      senderPublicKey,
    }
  })
}
