# @waves/waves-games  [![npm version](https://badge.fury.io/js/@waves%2Fwaves-games.svg)](https://www.npmjs.com/package/@waves/waves-games)

Create and deliver game assets through Waves Platform

This library provides a hight level abstraction over NODE REST API and MATCHER REST API
and enables game developers to do the following: 
- Create an item on blockchain with arbitrary metadata
- Track an item among players (wallets)
- Sell an item via Waves DEX
- Buy an item via Waves DEX
- List items assosiated with a particular game (address)
- List items for sale by players or developers

### Usage

```js
async function howToCreateAnItem(creatorSeed) {

    const { Items } = require('@waves/waves-games')
    const { create } = Items(ChainId.Testnet)
   
    const items = Items(ChainId.Testnet)
    const request = create(100, true, { version: 1, main: { name: 'The sword of pain', img: 'img_url' }, misc: {} creatorSeed)
    const item = await request.execute()
}
```
