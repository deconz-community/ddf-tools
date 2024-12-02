#!/usr/bin/env node

const concurrently = require('concurrently')

concurrently([
  {
    command: 'pnpm run watch-web',
    name: 'webpack',
    prefixColor: '#3498db',
  },
  {
    command: 'pnpm run run-in-browser',
    name: 'vscode',
    prefixColor: '#f39c12',
    dependsOn: ['webpack'],
  },
])
