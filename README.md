# WAVES ITEMS
## Items Protocol
The Items protocol is supported on the Waves blockchain by convention. Namely speaking it is a set of rules and transaction format restrictions. There is no specific capabilities or checks for an item format on Waves blockchain itself. Items protocol convention is a subject to change. For now it operates with **version 1**. Waves team will put their best efforts to provide backward compatibility is case of future changes.

Now let's take a look on how everything woks.

To represent an item on Waves blockchain you should submit **two** transactions with a specific format. 

### 1. Issue transaction
The first one is issue transaction. It describes an asset - a primitive consensus entity, which will represent an item on the Waves blockchain.

Let's look at the issue transaction that follows the Waves items protocol:
```js
{
  id: '8GyBZQjQ8GSpxvs9FWnu7MCCUzfJ45oVJQQb3ivLoA17',
  type: 3,
  version: 2,
  name: 'ITEM',
  description: '',
  quantity: 100,
  script: undefined,
  decimals: 0,
  reissuable: false,
  fee: 100000000,
  timestamp: 1562248791746,
  chainId: 84,
  senderPublicKey: '4Gqd2YuaCMh4PM6nVt33NJbETWMkJ5sHerJQCcd4Fbhe',
  proofs: ['4HkJ5TLM7HFzuiLYrY7CTyoTXcNSVs4tBiMo2Jud7be6rF14Ja9AA2qujFwhFA3WGeRw2QxvuSnc3fceMXNBJpXs']
}
```

This is a standard issue transaction with an extra restrictions:
- *name* should be **ITEM**
- *description* should be **empty**
- *script* should be **undefined**
- *decimals* should be **0**
- *reissuable* should be **false**

You can broadcast transactions to Waves blockchain via node REST API using 
**/transactions/broadcast** endpoint. You can read more about node api and play around with it using public Waves node [mainnet](https://nodes.wavesnodes.com) or [testnet](https://testnodes.wavesnodes.com) pools.

### 2. Data transaction
The second transaction is **Data transaction**. It describes the particular in-game item and holds all the metadata that particular game will use.

Here is data transaction example that should follow the issue transaction from the first section: 

```js
{
  id: 'DJadLmeQkcU4f7eGdXAqnSoKwLJbpZ3eXRMJSVcbnGT6',
  type: 12,
  version: 1,
  data: [{
      type: 'string',
      key: '8GyBZQjQ8GSpxvs9FWnu7MCCUzfJ45oVJQQb3ivLoA17',
      value: '{"version":1,"name":"The sword of pain","imageUrl":"https://i.pinimg.com/originals/02/c0/46/02c046b9ec76ebb3061515df8cb9f118.jpg","misc":{"damage":22,"power":13}}'
  }]
  fee: 100000,
  timestamp: 1562248791771,
  senderPublicKey: '4Gqd2YuaCMh4PM6nVt33NJbETWMkJ5sHerJQCcd4Fbhe',
  proofs: ['4i4e4cCvTajmSUFonzeRGhMNxHMX5S5E3jaq1fDdJ7svC74vspRm8ZPSMX3zdx7AfZ51A85HMZj6ywrENuZxTKcK'],
}
```
This is a standard data transaction with an extra restrictions:
- *data key* should equal to **issue transaction ID**
- *data value* should be a serialised **JSON string with an Item payload object**

#### Item payload
Item payload is an convention entity that has the following format:

```json
{
  "version": 1,
  "name": "The sword of pain",
  "imageUrl": "https://i.pinimg.com/originals/02/c0/46/02c046b9ec76ebb3061515df8cb9f118.jpg",
  "misc": {
    "damage": 22,
    "power": 13
  }
}
```
It describes the item and may contain the optional **misc** field with the item properties.

Luckily you have no need to build and broadcast transactions yourself, instead you may use a dedicated npm-package **@waves/waves-games** for this.


## @waves/waves-games

#### Installation
```
npm i @waves/waves-games 
```

#### Create an item
```ts
import { wavesItemsApi } from '@waves/waves-transactions'
const seed = 'my secret backend seed'

async function createItem() {
  const items = wavesItemsApi('T') //testnet, use 'W' for mainnet
  const item = await items
    .createItem({
      version: 1,
      quantity: 100,
      name: 'The sword of pain',
      imageUrl: 'https://i.pinimg.com/originals/02/c0/46/02c046b9ec76ebb3061515df8cb9f118.jpg',
      misc: {
        damage: 22,
        power: 13,
      },
    }).broadcast(seed)
  console.log(item)
}
createItem()
```

