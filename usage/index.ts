import { Items } from '../src/index'
import { ChainId } from '../src/types'

const seed = '9e0fa09dcc6e40ae95f5d8e6795c76c5fb97507be9ff40d9b6f58df27c171e53'

async function createItem() {
  const items = Items(ChainId.Testnet)
  const request = items.create({ amount: 100, version: 1, name: 'The sword of pain', imageUrl: 'img_url', misc: {}, isLimited: true }, seed)
  const item = await request.execute()
  console.log(item)
}
createItem()


async function getItem() {
  const items = Items(ChainId.Testnet)
  const item = await items.getItem('6vq5YokeJUeCU3BCah65LTgiS5ESzjJdNurddY4ZDhcG', false)
  console.log(item)
}
//getItem()


async function getItemList() {
  const items = Items(ChainId.Testnet)
  const list = await items.getItemList('creatorAddress')
  console.log(list)
}
//getItemList()


//If item was not previously freezeed you can change amount of items created
async function changeAmount() {
  const items = Items(ChainId.Testnet)
  items.changeAmount('6vq5YokeJUeCU3BCah65LTgiS5ESzjJdNurddY4ZDhcG', 10, false, seed)
}
//changeAmount()
