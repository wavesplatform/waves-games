import { Items } from '../src/index'
import { ChainId } from '../src/types'

async function test() {

  const seed = '9e0fa09dcc6e40ae95f5d8e6795c76c5fb97507be9ff40d9b6f58df27c171e53'

  const items = Items(ChainId.Testnet)
  const request = items.create(100, true, { version: 1, main: { name: 'The sword of pain', img: 'img_url' }, misc: {} }, seed)
  const item = await request.execute()

  console.log(item)

}

test()