# @waves/waves-games  [![npm version](https://badge.fury.io/js/@waves%2Fwaves-games.svg)](https://www.npmjs.com/package/@waves/waves-games)

Create and deliver game assets through Waves Platform

### Usage

```js
import { WavesItems, ParamsVer, isResult } from "@waves/waves-games"

//'T' for testnet
//'W' for mainnet

const items = WavesItems('T')

async function howToCreateAnItem(seed) {

  console.log(address(seed, 'T'))

  const response = await items.create(seed, 100, false, {
    version: ParamsVer.One,
    main: {
      name: 'The great slayer of pain',
      img: 'https://cdn5.vectorstock.com/i/thumb-large/26/39/magic-sword-isolated-game-element-vector-20492639.jpg',
    },
    //user payload to use in game (arbitrary data)
    misc: {
      power: 10,
      attack: 12
    }
  })

  if (isResult(response)) {
    //item created 
    const itemId = response.result.id
    console.log(response.result)
  } else {
    //error
    console.log(response.error)
  }

}

async function howToChangeItemSuplyIfItemIsNotLimited(seed, itemId) {

  const response = await items.changeSuply(seed, itemId, +100)
  if (isResult(response)) {
    console.log(response.result)
  }

}

async function howToGetPreviouslyCteatedItemInfo(itemId) {

  const response = await items.getItemInfo(itemId, true)
  if (isResult(response)) {
    console.log(response.result)
  }

}

async function howToGetItemListByGameAddress(gameAddress) {

  const response = await items.getItemList(gameAddress)
  if (isResult(response)) {
    console.log(response.result)
  }

}

async function howToSellAnItemForWaves(seed, itemId, priceInWaves, amount) {

  const response = await items.sellItem(seed, itemId, items.waves(priceInWaves), amount)
  if (isResult(response)) {
    console.log(response.result)
  }

}

async function howToGetAListOfItemsForSale(itemId) {
  const response = await items.itemsForSale(itemId, 'WAVES')
  if (isResult(response)) {
    console.log(response.result)
    /* response example
    [
      { amount: 1, price: 1.2 }
    ]
    */
  }
}


```
