import { TTx } from '@waves/waves-transactions'

declare const WavesKeeper: any

export const signWithKeeper = async (txs: TTx[]): Promise<TTx[]> => {
  if (!WavesKeeper) {
    throw new Error('Waves keeper is not installed.')
  }

  const r = await WavesKeeper.signTransactionPackage(txs
    .map(x => {
      delete x.proofs
      delete x.senderPublicKey
      return x
    })
    .map((x: any) => ({
      type: x.type.valueOf(),
      data: {
        ...x,
        fee: { assetId: 'WAVES', coins: x.fee },
        amount: x['amount'] ? { assetId: 'WAVES', coins: x['amount'] } : undefined,
      },
    })) as any)

  return txs.map((x, i) => {
    const { proofs, senderPublicKey } = JSON.parse(r[i])
    return {
      ...x,
      proofs,
      senderPublicKey,
    }
  })
}
