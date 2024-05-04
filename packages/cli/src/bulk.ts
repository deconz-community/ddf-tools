/* eslint-disable no-console */
import path from 'node:path'
import fs from 'node:fs/promises'
import { program } from '@commander-js/extra-typings'
import glob from 'fast-glob'
import { createDirectus, rest, staticToken } from '@directus/sdk'

export function bulkCommand() {
  program
    .command('bulk')
    .description('Run bulk operations on DDF files.')
    .argument('<path>', 'Source DDF file / directory')
    .option('--store-url <url>', 'Use a custom store URL instead of the default')
    .option('--store-token <token>', 'Authentication token')
    .action(async (input, options) => {
      const {
        storeUrl,
        storeToken,
      } = options

      // #region Validate options
      if ((!storeUrl || !storeToken)) {
        console.error('You must provide both --store-url and --store-token')
        return
      }

      const client = createDirectus(storeUrl).with(staticToken(storeToken)).with(rest())

      const newUUIDs = await client.request<{ expire_at: string, uuid: string[] }>(() => {
        return {
          method: 'GET',
          path: 'bundle/generateUUID',
          params: {
            count: 5,
          },
        }
      })

      console.log(newUUIDs)

      console.log('Reading source files...')
    })
}
