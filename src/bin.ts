#!/usr/bin/env node

import { ChainId } from './types'
import * as program from 'commander'
import { Items } from './items'

program
  .version('0.0.1')
  .command('create-item <item> <seed>')
  .action(async function (item, seed) {
    const params = eval("(" + item + ")")
    params.version = 1
    try {
      const r = await (Items(ChainId.Mainnet).create(params, seed).execute())
      console.log(r)
    } catch (error) {
      console.log(error)
    }
  })


program.parse(process.argv)

//Command example
//"{ amount: 100, version: 1, name: 'The sword of pain', imageUrl: 'img_url', misc: {}, isLimited: true }" "SECRET_SEED"