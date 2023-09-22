#!/usr/bin/env node

const concurrently = require('concurrently')

concurrently([
  {
    command: 'npx --node-options=--inspect directus start',
    name: 'directus',
    prefixColor: 'yellow.bold',
  },
  {
    command: 'pnpm --dir packages/main run dev',
    name: 'extensions',
    prefixColor: 'cyan.bold',
  },
])
