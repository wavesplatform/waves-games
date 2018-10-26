import { WavesItems, ParamsVer, isResult } from '../dist/index'
import { address } from 'waves-crypto'

const seed = '9418c6cdd6cd420dabf07ec3d5ba64ac7fa8c37d1daf4165990b462125a44014'
const { create, sellItem, waves, itemsForSale } = WavesItems('T')

async function test() {
  // const item = await create(seed, 100, true, {
  //   version: ParamsVer.One,
  //   main: {
  //     name: 'The great slayer of pain',
  //     img: 'https://cdn5.vectorstock.com/i/thumb-large/26/39/magic-sword-isolated-game-element-vector-20492639.jpg',
  //   },
  //   //user payload to use in game (arbitrary data)
  //   misc: {
  //     power: 10,
  //     attack: 12
  //   }
  // })

  // if (isResult(item)) {
  //   const itemId = item.result.id
  //   console.log(itemId)
  //   await sellItem(seed, itemId, waves(2.3), 1)
  // }

  //await sellItem(seed, '5GvcCUKCedvnNYQQFUTYig4Pb1uLqGZuf8sRRd8yxFW8', waves(1.2), 1)

  const a = await itemsForSale('5GvcCUKCedvnNYQQFUTYig4Pb1uLqGZuf8sRRd8yxFW8', 'WAVES')
  console.log(a)
}

console.log(address(seed, 'T'))
test()