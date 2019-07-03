import { readFileSync } from 'fs'
import { resolve } from 'path'
import './extensions'
import { green, end } from './colors'
import prompt from 'prompts'

export const promptOneOf = async <T>(options: { value: T; title: string }[], text: string): Promise<T> => {
  const result = await prompt({
    type: 'select',
    name: 'value',
    message: text,
    choices: options.map(({ value, title }) => ({ value: JSON.stringify(value), title })),
  })

  if (!result.value) throw new Error('Aborted by user.')

  return JSON.parse(result.value) as T
}

export const promptForFile = async (text: string, contentValidator?: (content: string) => boolean | string): Promise<string> => {
  const result = await prompt({
    type: 'text',
    name: 'value',
    message: text,

    validate: filePath => {
      try {
        const content = readFileSync(resolve(process.cwd(), filePath), { encoding: 'utf8' })
        return contentValidator ? contentValidator(content) : true
      } catch (error) {
        return error.message
      }
    },
  })

  if (!result.value) throw new Error('Aborted by user.')

  return readFileSync(resolve(process.cwd(), result.value), { encoding: 'utf8' })
}

export const promptForNumber = async (text: string, validate?: (value: number) => boolean | string): Promise<number> => {
  const result = await prompt({
    type: 'number',
    name: 'value',
    message: text,
    validate,
  })

  if (!result.value) throw new Error('Aborted by user.')

  return result.value
}

export const promptForDate = async (text: string, validate?: (date: Date) => boolean | string): Promise<Date> => {
  const result = await prompt({
    type: 'date',
    name: 'value',
    message: text,
  })

  if (!result.value) throw new Error('Aborted by user.')

  return result.value
}

export const promptForString = async (text: string, options?: { regexp: RegExp; errorMessage: string }): Promise<string> => {
  const result = await prompt({
    type: 'text',
    name: 'value',
    message: text,
    validate: answer => {
      if (!answer) {
        return 'Provide a non empty value please.'
      }

      if (options) {
        if (!options.regexp.test(answer)) {
          return options.errorMessage
        }
      }

      return true
    },
  })

  if (!result.value) throw new Error('Aborted by user.')

  return result.value
}

export const promptConfirmation = async (text: string): Promise<boolean> => {
  const result = await prompt({
    type: 'toggle',
    name: 'value',
    message: text,
    initial: false,
    active: 'YES',
    inactive: 'NO',
  })

  if (result.value == undefined) throw new Error('Aborted by user.')

  return result.value
}

export const spinner = (text: string, done?: string) => {
  console.log('')
  var spinner = require('cli-spinner').Spinner
  var spinner = new spinner(text)
  spinner.setSpinnerString('⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏')
  spinner.start()

  return {
    stop: () => {
      spinner.stop(true)
      if (done) {
        console.log(done)
      } else {
        console.log(text, `${green}✔${end}`)
      }
    },
  }
}
