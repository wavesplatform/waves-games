import { wavesItems } from '../src/index'
import { address } from '@waves/waves-crypto'

const seed = '9e0fa09dcc6e40ae95f5d8e6795c76c5fb97507be9ff40d9b6f58df27c171e53'

async function createItem() {
  const items = wavesItems('T')
  const request = items.createItem({ quantity: 100, version: 1, name: 'The sword of pain', imageUrl: 'img_url', misc: {} })
  const item = await request.broadcast(seed)
  console.log(item)
}
createItem()


async function getItem() {
  const items = wavesItems('T')
  const item = await items.getItem('6vq5YokeJUeCU3BCah65LTgiS5ESzjJdNurddY4ZDhcG')
  console.log(item)
}
//getItem()


async function getItemList() {
  const items = wavesItems('T')
  const list = await items.getItemCatalog(address(seed, 'T'))
  console.log(list)
}
//getItemList()


