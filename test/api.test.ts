import { Api, ApiOptions } from '../src/internal/api'
import { ChainId } from '../src/internal/types'
import { config } from '../src/internal/config'
import { order } from '@waves/waves-transactions'

// You must create file with your private seed
import { TEST_SEED } from './test-seed'

const chain = config.chains[ChainId.Testnet]
const apiOptions: ApiOptions = {
  nodeUri: chain.nodeUri,
  matcherUri: chain.matcherUri,
}

function createApi(options: ApiOptions): Api {
  return new Api(options)
}

describe('api', () => {
  let api: Api

  beforeAll(() => {
    api = createApi(apiOptions)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('create order', async () => {
    const orderTx = order({
      amount: 1,
      price: 100,
      matcherPublicKey: chain.matcher,
      orderType: 'buy',
      amountAsset: config.wavesId,
      priceAsset: chain.btcId,
    }, TEST_SEED)

    await api.createOrder(orderTx)
  })
})
