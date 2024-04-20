#!/usr/bin/env node

const concurrently = require('concurrently')

concurrently([
  {
    command: 'pnpm start',
    name: 'directus',
    prefixColor: '#f39c12',
  },
  {
    command: 'pnpm --dir ../store-extension run dev',
    name: 'extensions',
    prefixColor: '#3498db',
  },
  {
    command: 'pnpm --dir ../oauth-pop-up run dev',
    name: 'oauth-pop-up',
    prefixColor: '#2ecc71',
  },
  {
    command: 'node scripts/propagate_watcher.cjs',
    name: 'watcher',
    prefixColor: '#34495e',
  },
])
