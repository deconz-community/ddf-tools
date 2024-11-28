#!/usr/bin/env node

import { createRequire } from 'node:module'
import process from 'node:process'
import { program } from '@commander-js/extra-typings'
import { bulkCommand } from './bulk'
import { bundleCommand } from './bundle'
import { validateCommand } from './validate'

const packageDefinition = createRequire(import.meta.url)('../package.json')

program
  .name('ddf-tools')
  .version(packageDefinition.version, '--version')
  .description('A command line tool for working with DDFs.')

validateCommand()
bundleCommand()
bulkCommand()

program.parse(process.argv)
