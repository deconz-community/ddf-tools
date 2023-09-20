#!/usr/bin/env node

import process from 'node:process'
import { createRequire } from 'node:module'
import { program } from 'commander'

import { bundler } from './src/bundler.js'
import { validator } from './src/validator.js'

const packageDefinition = createRequire(import.meta.url)('./package.json')

program
  .name('ddf-tools')
  .version(packageDefinition.version)
  .description('A command line tool for working with DDFs.')

bundler()
validator()

program.parse(process.argv)
