import { wavesItemsApi, Versions } from '../dist'
import { wavesApi, config, axiosHttp, apolloHttp, delay } from '@waves/waves-rest'
import axios from 'axios'
import { randomSeed, address, concat } from '@waves/waves-crypto'
import { transfer, TTx } from '@waves/waves-transactions'

jest.setTimeout(1000000)
const cfg = config.testnet
const { waitForTx, broadcast } = wavesApi(cfg, axiosHttp(axios))

const waitForTxs = (txs: (TTx & { id: string })[]) => Promise.all(txs.map(x => waitForTx(x.id)))

const api = wavesItemsApi(cfg.chainId)
const seed = '108de7f5c7034211b6695d9ab083d4b9b9fda8e53ec84c8aa3c834a62f52e261'

xtest('create item an get it back', async () => {
  const itemCreationParams = {
    version: 1 as Versions,
    name: 'Sword of magic',
    quantity: 100,
    imageUrl: 'http://cdn.my-game.com/img/a41a636e-c64f-447a-b47b-ac52225a6b1f',
    misc: {
      id: 'a41a636e-c64f-447a-b47b-ac52225a6b1f',
      power: 13,
      cagory: 'rare',
    },
  }

  const itemCreationIntent = await api.createItem(itemCreationParams)

  const [issue, data] = await itemCreationIntent.entries(seed)

  const item = await itemCreationIntent.broadcast(seed)

  expect(item).toMatchObject({
    id: issue.id,
    name: itemCreationParams.name,
    quantity: itemCreationParams.quantity,
  })

  await Promise.all([waitForTx(issue.id), waitForTx(data.id)])

  const itemFromBlockchain = await api.getItem(item.id)

  expect(item).toEqual(itemFromBlockchain)
})

test('buy\\sell item', async () => {
  const itemId = '9y8ho76Gt3RbEnxr2EDztAGhM3Bbgz7WhiscF9knmnF3'
  const gameId = address(seed, cfg.chainId)
  const userA = randomSeed()
  const userB = randomSeed()

  const itemTransferToA = transfer({ recipient: address(userA, cfg.chainId), assetId: itemId, amount: 1 }, seed)
  const wavesTransferToA = transfer({ recipient: address(userA, cfg.chainId), assetId: null, amount: 300001 }, seed)
  const wavesTransferToB = transfer({ recipient: address(userB, cfg.chainId), assetId: null, amount: 300001 }, seed)

  broadcast(itemTransferToA)
  broadcast(wavesTransferToA)
  broadcast(wavesTransferToB)

  await waitForTxs([itemTransferToA, wavesTransferToA, wavesTransferToB])
  await api.sellItem(itemId, 100000000).broadcast(userA)
  await api.buyItem(itemId, 100000000).broadcast(userB)

  await delay(10000)

  const inventory = await api.getUserInventory(gameId, address(userB, cfg.chainId))

  expect(inventory.items.length).toEqual(1)
  expect(inventory.items[0].item.id).toEqual(itemId)
})
