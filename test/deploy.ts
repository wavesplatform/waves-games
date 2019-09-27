import { wavesApi, config, axiosHttp } from '@waves/waves-rest'
import { transfer, setScript } from '@waves/waves-transactions'
import { address, ChaidId } from '@waves/ts-lib-crypto'
import { buySellContract } from './buy-sell-contract'
import { compile } from '@waves/ride-js'
import axios from 'axios'

const waves = Math.pow(10, 8)

const targets = [
  {
    chainId: 'W',
    root: '2da04b20649a4e85af017d43561d8e1968df2a556510493e8ad364152088adad',
    target: '27668c3b85e147b1848e2999d2d5383ad7dc29666b8e48ca9bf2a48674555d27',
  },
  {
    chainId: 'T',
    root: '108de7f5c7034211b6695d9ab083d4b9b9fda8e53ec84c8aa3c834a62f52e261',
    target: 'a506bedfd73947aa8b260a83ccc16712dc2fae46a30d42448ee67ba47068c2ae',
  },
]

const deployBuySellContracts = async () => {
  try {
    const p = targets.map(async ({ root, target, chainId }) => {
      const { broadcastAndWait } = wavesApi(
        ChaidId.isMainnet(chainId) ? config.mainnet : config.testnet,
        axiosHttp(axios),
      )
      const targetAddress = address(target, chainId)
      console.log(targetAddress)

      const wavesTransferToTarget = transfer({ recipient: targetAddress, amount: 0.1 * waves }, root)
      await broadcastAndWait(wavesTransferToTarget)

      const setScriptTx = setScript(
        {
          additionalFee: 400000,
          script: (compile(buySellContract) as any).result.base64,
          chainId,
        },
        target,
      )
      await broadcastAndWait(setScriptTx)
    })

    return await Promise.all(p)
  } catch (error) {
    console.log(JSON.stringify(error, undefined, 2))
  }
}

deployBuySellContracts().then(x => {
  console.log(JSON.stringify(x, undefined, 2))
})
