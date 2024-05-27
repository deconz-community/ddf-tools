#!/usr/bin/env node

import process from 'node:process'
import { createRequire } from 'node:module'
import { program } from '@commander-js/extra-typings'
import { validateCommand } from './validate'
import { bundleCommand } from './bundle'
import { bulkCommand } from './bulk'

const packageDefinition = createRequire(import.meta.url)('../package.json')

program
  .name('ddf-tools')
  .version(packageDefinition.version, '--version')
  .description('A command line tool for working with DDFs.')

validateCommand()
bundleCommand()
bulkCommand()

program.parse(process.argv)
