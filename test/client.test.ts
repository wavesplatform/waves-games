import { ChainId, ClientOptions, ItemParams } from '../src/internal/types'
import { Client } from '../src'
import { TEST_SEED } from './test-seed'

const clientOptions: ClientOptions = {
  seed: TEST_SEED,
  chainId: ChainId.Testnet,
}

const itemParams: ItemParams<any> = {
  version: 0,
  name: 'Test Item',
  imageUrl: '#',
  misc: {
    damage: 1,
  },
}

function createClient(options: ClientOptions): Client {
  return new Client(options)
}

describe('client', () => {
  let client: Client

  beforeAll(() => {
    client = createClient(clientOptions)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('create item', async () => {
    const item = await client.createItem(itemParams, 10, false)

    console.log(item)

    expect(item.name).toBe(itemParams.name)
  })
})
