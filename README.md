# @waves/waves-games  [![npm version](https://badge.fury.io/js/@waves%2Fwaves-games.svg)](https://www.npmjs.com/package/@waves/waves-games)

### Usage

```js
import { WavesItems, ParamsVer, isResult } from "@waves/waves-games"

//'T' for testnet
//'W' for mainnet

const items = WavesItems('T')

async function howToCreateAnItem(seed) {

  const response = await items.create(seed, 100, false, {
    version: ParamsVer.One,
    main: {
      name: 'The great slayer of pain',
      img: 'https://cdn5.vectorstock.com/i/thumb-large/26/39/magic-sword-isolated-game-element-vector-20492639.jpg',
    },
    //user payload to use later in game (arbitrary data)
    misc: {
      power: 10,
      attack: 12
    }
  })

  if (isResult(response)) {
    //item created 
    const itemId = response.result.id
    console.log(response.result)
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

```
