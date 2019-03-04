import { ClientOptions } from '../src/internal/types'
import { Client } from '../src'

function createClient(options: ClientOptions): Client {
  return new Client(options)
}

describe('client', () => {
  let client: Client

  beforeAll(() => {
    client = createClient(<any>{})
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })
})
