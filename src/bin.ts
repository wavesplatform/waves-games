#!/usr/bin/env node

import { wavesItemsApi } from './waves-items-api'
import {
  promptOneOf,
  promptForNumber,
  promptForString,
  promptForFile,
  promptConfirmation,
  spinner,
  withSpinner,
} from './prompts-generic'
import { cyan, end, red } from './colors'
import { totalFee, formatWaves } from './utils'
import { urlRegexp } from './utils'
import { crypto, ChaidId } from '@waves/waves-crypto'
import { wavesApi, config, axiosHttp } from '@waves/waves-rest'
import axios from 'axios'

// program
//   .version('0.0.1')
//   .command('create-item <item> <seed>')
//   .action(async function (item, seed) {
//     const params = eval("(" + item + ")")
//     params.version = 1
//     try {
//       const r = await (wavesItems(MAIN_NET_CHAIN_ID).createItem(params).broadcast(seed))
//       console.log(r)
//     } catch (error) {
//       console.log(error)
//     }
//   })

// program.parse(process.argv)

//Command example
//"{ amount: 100, version: 1, name: 'The sword of pain', imageUrl: 'img_url', misc: {}, isLimited: true }" "SECRET_SEED"

const wizard = async (chainId: string) => {
  try {
    const { address } = crypto()
    const { broadcast } = wavesApi(ChaidId.isMainnet(chainId) ? config.mainnet : config.testnet, axiosHttp(axios))

    const name = await promptForString(`Provide an item name ${cyan}(eg. Sword of power)${end}: `)
    const imageUrl = await promptForString(
      `Provide an image url ${cyan}(eg. https://cdn.awesomegame.com/img/id)${end}: `,
      {
        regexp: urlRegexp,
        errorMessage: 'Please provide a valid url.',
      },
    )
    const quantity = await promptForNumber('Provide quantity: ')
    const seed = await promptForFile(`Please specify seed file path ${cyan}(eg. ./seed.txt)${end}: `)

    const { createItem } = wavesItemsApi(chainId)

    const intent = createItem({ quantity, name, version: 1, imageUrl, misc: {} })

    const [issue, data] = await intent.entries(seed)

    console.log(`
  You are about to broadcast ${cyan}2 transactions${end} to ${cyan}${chainId === 'W' ? 'MAINNET' : 'TESTNET'}${end}
  From address: ${cyan}${address(seed, chainId)}${end}
  Total fee will be: ${cyan}${formatWaves(totalFee(issue, data))} Waves${end}.

  The following item will be created:
  `)

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { printTable } = require('console-table-printer')
    const futureItem = await intent.preview(seed)
    delete futureItem.gameId
    delete futureItem.created

    const misc = Object.entries(futureItem.misc)
      .map(([k, v]) => `${k} : ${v}`)
      .join('\n')

    printTable([{ ...futureItem, misc: misc ? misc : 'none' }])

    spinner('%s Broadcasting transactions to blockchain...')

    if (await promptConfirmation('Do you want to proceed?')) {
      await withSpinner('Broadcasting transactions to blockchain', Promise.all([broadcast(issue), broadcast(data)]))
      console.log('Item creation successful.')
    } else {
      console.log('Item creation cancelled.')
    }
  } catch (ex) {
    console.log(ex)
  }
}

const main = async () => {
  try {
    const chainId = await promptOneOf(
      [{ value: 'W', title: '1. MAIN NET' }, { value: 'T', title: '2. TEST NET' }],
      'Please choose the environment:',
    )

    const value = await promptOneOf(
      [
        { value: 1, title: '1. Create item wizard' },
        { value: 2, title: '2. Create item CLI' },
        { value: 3, title: '3. File batch item creation' },
      ],
      'Please select one of the following options:',
    )

    switch (value) {
      case 1:
        await wizard(chainId)
        break
      default:
        console.log('The option is not awailable yet.')
    }
  } catch (ex) {
    console.log(`${red}${ex.message}${end}`)
  }
}

main()
