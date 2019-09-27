import { wavesItemsApi } from '../src'
import { wavesApi, config, axiosHttp } from '@waves/waves-rest'
import { compile } from '@waves/ride-js'
import axios from 'axios'
import { randomSeed, address } from '@waves/ts-lib-crypto'
import { transfer, TTx, setScript } from '@waves/waves-transactions'
import { buySellContract } from './buy-sell-contract'

jest.setTimeout(1000000)
const waves = Math.pow(10, 8)
const cfg = config.testnet
const { waitForTx, broadcast, broadcastAndWait } = wavesApi(cfg, axiosHttp(axios))

const waitForTxs = (txs: (TTx & { id: string })[]) => Promise.all(txs.map(x => waitForTx(x.id)))

const seed = '108de7f5c7034211b6695d9ab083d4b9b9fda8e53ec84c8aa3c834a62f52e261'

// xtest('create item an get it back', async () => {
//   const itemCreationParams = {
//     version: 1 as Versions,
//     name: 'Sword of magic',
//     quantity: 100,
//     imageUrl: 'http://cdn.my-game.com/img/a41a636e-c64f-447a-b47b-ac52225a6b1f',
//     misc: {
//       id: 'a41a636e-c64f-447a-b47b-ac52225a6b1f',
//       power: 13,
//       cagory: 'rare',
//     },
//   }

//   const itemCreationIntent = await api.createItem(itemCreationParams)

//   const [issue, data] = await itemCreationIntent.entries(seed)

//   const item = await itemCreationIntent.broadcast(seed)

//   expect(item).toMatchObject({
//     id: issue.id,
//     name: itemCreationParams.name,
//     quantity: itemCreationParams.quantity,
//   })

//   await Promise.all([waitForTx(issue.id), waitForTx(data.id)])

//   const itemFromBlockchain = await api.getItem(item.id)

//   expect(item).toEqual(itemFromBlockchain)
// })

test('buy\\sell item', async () => {
  const itemId = '9y8ho76Gt3RbEnxr2EDztAGhM3Bbgz7WhiscF9knmnF3'
  const contract = randomSeed()
  const userA = randomSeed()
  const userB = randomSeed()

  const wavesTransferToContract = transfer({ recipient: address(contract, cfg.chainId), amount: 0.1 * waves }, seed)
  const itemTransferToA = transfer({ recipient: address(userA, cfg.chainId), assetId: itemId, amount: 1 }, seed)
  const wavesTransferToA = transfer({ recipient: address(userA, cfg.chainId), assetId: null, amount: 1 * waves }, seed)
  const wavesTransferToB = transfer({ recipient: address(userB, cfg.chainId), assetId: null, amount: 1 * waves }, seed)

  await broadcastAndWait(wavesTransferToContract)

  const api = wavesItemsApi(cfg.chainId, address(contract, cfg.chainId))

  const script = setScript({ script: (compile(buySellContract) as any).result.base64, chainId: cfg.chainId }, contract)

  await broadcastAndWait(script)

  broadcast(itemTransferToA)
  broadcast(itemTransferToA)
  broadcast(wavesTransferToA)
  broadcast(wavesTransferToB)

  await waitForTxs([itemTransferToA, wavesTransferToA, wavesTransferToB])
  const i = await api.sell(itemId, 1, null, 0.1 * waves).broadcast(userA)
  await waitForTx(i.id)

  await api.buy(i.id, 1).broadcast(userB)

  // const inventory = await api.getUserInventory(gameId, address(userB, cfg.chainId))

  // expect(inventory.items.length).toEqual(1)
  // expect(inventory.items[0].item.id).toEqual(itemId)
})
