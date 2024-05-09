#!/usr/bin/env node

import process from 'node:process'
import { createRequire } from 'node:module'
import { program } from '@commander-js/extra-typings'
import { validator } from './validator'
import { bundlerCommand } from './bundler'
import { bulkCommand } from './bulk'
import { testCommand } from './test'

const packageDefinition = createRequire(import.meta.url)('../package.json')

program
  .name('ddf-tools')
  .version(packageDefinition.version)
  .description('A command line tool for working with DDFs.')

validator()
bundlerCommand()
bulkCommand()
testCommand()

program.parse(process.argv)
