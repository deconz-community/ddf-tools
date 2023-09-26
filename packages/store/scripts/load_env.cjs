#!/usr/bin/env node

const path = require('node:path')
const dotenv = require('dotenv')

module.exports = function () {
  return {
    ...dotenv.config({ path: path.resolve(__dirname, '../.env') }).parsed,
    ...dotenv.config({ path: path.resolve(__dirname, '../.env.local') }).parsed,
  }
}
