import { Api, ApiOptions } from '../src/internal/api'
import { ChainId } from '../src/internal/types'
import { config } from '../src/internal/config'
import { cancelOrder, IOrderParams, order } from '@waves/waves-transactions'
import { address } from '@waves/waves-crypto'
import { TEST_SEED } from './test-seed'

const chain = config.chains[ChainId.Testnet]
const apiOptions: ApiOptions = {
  nodeUri: chain.nodeUri,
  matcherUri: chain.matcherUri,
}
const senderAddress = address(TEST_SEED)
const orderParams: IOrderParams = {
  amount: 100000000,
  price: 100000,
  matcherPublicKey: chain.matcher,
  orderType: 'sell',
  amountAsset: config.wavesId,
  priceAsset: chain.btcId,
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

  it('place order', async () => {
    const orderTx = order(orderParams, TEST_SEED)

    const placedOrder = await api.placeOrder(orderTx)
    expect(placedOrder.id).toBe(orderTx.id)
  })

  it('place invalid order', async () => {
    const badOrderTx = order({ ...orderParams, matcherPublicKey: '' }, TEST_SEED)

    await expect(api.placeOrder(badOrderTx)).rejects.toThrow()
  })

  it('cancel order', async () => {
    const orderTx = order(orderParams, TEST_SEED)
    await api.placeOrder(orderTx)
    const orderData = cancelOrder({ orderId: orderTx.id }, TEST_SEED)

    const orderId = await api.cancelOrder(orderData)
    expect(orderId).toBe(orderTx.id)
  })
})
