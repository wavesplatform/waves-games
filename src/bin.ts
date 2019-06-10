#!/usr/bin/env node

import * as program from 'commander'
import { wavesItems } from 'index'
import { MAIN_NET_CHAIN_ID } from '@waves/waves-crypto'

program
  .version('0.0.1')
  .command('create-item <item> <seed>')
  .action(async function (item, seed) {
    const params = eval("(" + item + ")")
    params.version = 1
    try {
      const r = await (wavesItems(MAIN_NET_CHAIN_ID).createItem(params).broadcast(seed))
      console.log(r)
    } catch (error) {
      console.log(error)
    }
  })


program.parse(process.argv)

//Command example
//"{ amount: 100, version: 1, name: 'The sword of pain', imageUrl: 'img_url', misc: {}, isLimited: true }" "SECRET_SEED"