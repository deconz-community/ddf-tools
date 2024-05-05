/* eslint-disable no-console */
import path from 'node:path'
import fs from 'node:fs/promises'
import type { Command } from '@commander-js/extra-typings'
import { program } from '@commander-js/extra-typings'
import glob from 'fast-glob'
import { createDirectus, rest, staticToken } from '@directus/sdk'
import { z } from 'zod'

export function bulkCommand() {
  const bulk = program
    .command('bulk')
    .description('Bulk operations on DDF files.')

  bulkUUIDCommand(bulk)
}

export function bulkUUIDCommand(command: Command) {
  command
    .command('uuid')
    .description('Add missing UUID on DDF file.')
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

      // Generate input file list
      const inputFiles: string[] = []
      {
        const inputStat = await fs.stat(input)
        if (inputStat.isFile()) {
          inputFiles.push(input)
        }
        else if (inputStat.isDirectory()) {
          inputFiles.push(...await glob(`${input}/**/*.json`))
        }
        else {
          console.warn('Input must be a file or directory')
          return
        }
      }

      const minimumSchema = z.object({
        schema: z.string(),
        uuid: z.string().optional(),
      })

      console.log(inputFiles)

      const filesToEdit = (await Promise.all(inputFiles.map(async (inputFile) => {
        const content = await fs.readFile(inputFile, 'utf-8')
        const data = (() => {
          try {
            return minimumSchema.parse(JSON.parse(content))
          }
          catch (error) {
            console.error(`Invalid DDF file at ${inputFile}`)
            return undefined
          }
        })()

        if (!data)
          return

        if (data.schema !== 'devcap1.schema.json') {
          console.log(`Skip file with invalid schema (${data.schema}) at ${inputFile}`)
          return
        }

        if (data.uuid) {
          console.log(`Skip file with existing UUID (${data.uuid}) at ${inputFile}`)
          return
        }

        return [inputFile, content]
      }))).filter((data): data is [string, string] => data !== undefined)

      // console.log({ filesToEdit })

      if (filesToEdit.length === 0) {
        console.log('No files to edit.')
        return
      }

      if (filesToEdit.length > 100) {
        console.error('Too many files to edit. Please limit to 100 files.')
        return
      }

      const client = createDirectus(storeUrl).with(staticToken(storeToken)).with(rest())

      const newUUIDs = await client.request<{ expire_at: string, uuid: string[] }>(() => {
        return {
          method: 'GET',
          path: 'bundle/generateUUID',
          params: {
            count: filesToEdit.length,
          },
        }
      })

      await Promise.all(filesToEdit.map(async ([inputFile, content], index) => {
        const newLineCharacter = content.includes('\r\n') ? '\r\n' : '\n'
        const filePart = content.split(newLineCharacter)

        if (filePart.length < 10) {
          console.error(`File ${inputFile} seems invalid, less that 10 lines in the file.`)
          return
        }
        // Find the first line that contains "schema"
        const schemaLineIndex = filePart.findIndex(line => line.includes('devcap1.schema.json'))

        // Insert the UUID line after the schema line
        filePart.splice(schemaLineIndex + 1, 0, filePart[schemaLineIndex].replace('schema', 'uuid').replace('devcap1.schema.json', newUUIDs.uuid[index]))
        // Write the file back
        await fs.writeFile(inputFile, filePart.join(newLineCharacter))
      }))

      console.log(`${filesToEdit.length} files updated`)
    })
}
