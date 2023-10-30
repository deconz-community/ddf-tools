#!/usr/bin/env node

const concurrently = require('concurrently')

concurrently([
  {
    command: 'pnpm start',
    name: 'directus',
    prefixColor: 'yellow.bold',
  },
  {
    command: 'pnpm --dir ../store-extension run dev',
    name: 'extensions',
    prefixColor: 'cyan.bold',
  },
])
