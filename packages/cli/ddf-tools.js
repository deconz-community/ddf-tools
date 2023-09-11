#!/usr/bin/env node

import process from 'node:process'
import { createRequire } from 'node:module'
import { program } from '@commander-js/extra-typings'

import { validator } from './src/validator.js'

const packageDefinition = createRequire(import.meta.url)('./package.json')

program
  .name('ddf-tools')
  .version(packageDefinition.version)
  .description('Un exemple de commande CLI')

validator()

program.parse(process.argv)
