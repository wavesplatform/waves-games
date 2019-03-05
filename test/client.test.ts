import { ChainId, ClientOptions } from '../src/internal/types'
import { Client } from '../src'
import { TEST_SEED } from './test-seed'

const clientOptions: ClientOptions = {
  seed: TEST_SEED,
  chainId: ChainId.Testnet,
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
    
  })
})
