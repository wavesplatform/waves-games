import { wavesItemsApi, Versions } from '../dist'
import { wavesApi, config, axiosHttp } from '@waves/waves-rest'
import axios from 'axios'
import { transfer } from '@waves/waves-transactions'

jest.setTimeout(1000000)
const cfg = config.testnet
const { waitForTx } = wavesApi(cfg, axiosHttp(axios))
const api = wavesItemsApi(cfg.chainId)
const seed = '108de7f5c7034211b6695d9ab083d4b9b9fda8e53ec84c8aa3c834a62f52e261'

test('create item an get it back', async () => {
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
