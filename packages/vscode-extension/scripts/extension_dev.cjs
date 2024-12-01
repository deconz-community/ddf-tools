#!/usr/bin/env node

const concurrently = require('concurrently')

concurrently([
  {
    command: 'pnpm run run-in-browser',
    name: 'vscode',
    prefixColor: '#f39c12',
  },
  {
    command: 'pnpm run watch-web',
    name: 'compile',
    prefixColor: '#3498db',
  },
])
