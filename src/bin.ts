#!/usr/bin/env node

import { wavesItems } from './index'
import { promptOneOf, promptForNumber, promptForString, promptForFile, promptConfirmation } from './prompts-generic'
import { cyan, end } from './colors'
import * as readline from 'readline'

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
  const name = await promptForString(`Provide an item name ${cyan}(eg. Sword of power)${end}: `)
  const imageUrl = await promptForString(`Provide an image url ${cyan}(eg. https://cdn.awesomegame.com/img/id)${end}: `)
  const quantity = promptForNumber('Provide quantity: ')
  const seed = promptForFile(`Please specify seed file path ${cyan}(eg. ./seed.txt)${end}: `)

  const { createItem } = wavesItems(chainId)

  const intent = createItem({ quantity, name, version: 1, imageUrl, misc: {} })

  const a = await promptConfirmation('Confirm?')
  console.log(a)

  //    await intent.broadcast(seed)
}

const main = async () => {
  try {

    const chainId = await promptOneOf([
      { value: 'W', title: '1. MAIN NET' },
      { value: 'T', title: '2. TEST NET' },
    ], 'Please choose the environment:')

    const value = await promptOneOf([
      { value: 1, title: '1. Create item wizard' },
      { value: 2, title: '2. Create item CLI' },
      { value: 3, title: '3. File batch item creation' },
    ], 'Please select one of the following options:')

    switch (value) {
      case 1:
        await wizard(chainId)
        break
      default:
    }

  }
  catch (ex) {
    console.log(ex)
  }
}

main()