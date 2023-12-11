/* eslint-disable no-console */
import path from 'node:path'
import fs from 'node:fs/promises'
import { program } from '@commander-js/extra-typings'
import glob from 'fast-glob'
import { buildFromFiles, encode, sign } from '@deconz-community/ddf-bundler'
import { hexToBytes } from '@noble/hashes/utils'
import { createValidator } from '@deconz-community/ddf-validator'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'
import { createDirectus, rest, staticToken } from '@directus/sdk'
import { v4 as uuidv4 } from 'uuid'
import type { PrimaryKey } from '@directus/types'

export function bundlerCommand() {
  program
    .command('bundler')
    .description('Create a bundle from a file')
    .argument('<path>', 'Source DDF file / directory')
    .requiredOption('-g, --generic <path>', 'Generic directory path')
    .option('-o, --output <path>', 'Output directory path')
    .option('--no-validate', 'Disable validation of the DDF file')
    .option('--private-key <privateKey>', 'Private key to sign the bundle with')
    .option('--upload', 'Upload the bundle to the store after creating it')
    .option('--store-url <url>', 'Store URL')
    .option('--store-token <token>', 'Authentication token')
    .option('--tag <tag>', 'Registers the published bundle with the given tag. By default, the "latest" tag is used.')
    .action(async (input, options) => {
      const {
        generic,
        output,
        validate,
        privateKey,
        upload = false,
        storeUrl,
        storeToken,
        tag = 'latest',
      } = options

      // Validate options
      if (upload && (!storeUrl || !storeToken)) {
        console.log('You must provide both --store-url and --store-token when using --upload')
        return
      }

      {
        const genericStat = await fs.stat(generic)
        if (!genericStat.isDirectory()) {
          console.log('generic must be a directory')
          return
        }
      }

      if (!upload && !output) {
        console.log('You must provide either --upload or --output')
        return
      }

      if (output) {
        const outputStat = await fs.stat(output)
        if (!outputStat.isDirectory()) {
          console.log('output must be a directory')
          return
        }
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
          console.log('Input must be a file or directory')
          return
        }
      }

      await Promise.all(inputFiles.map(async (inputFile) => {
        const bundle = await buildFromFiles(
          `file://${path.resolve(generic)}`,
          `file://${path.resolve(inputFile)}`,
          async (filePath) => {
            console.log(inputFile, filePath)
            const data = await fs.readFile(filePath.replace('file://', ''))
            return new Blob([data])
          },
        )

        if (validate) {
          // TODO move this in a shared package
          const validator = createValidator()

          const validationResult = validator.bulkValidate(
            // Generic files
            bundle.data.files
              .filter(file => file.type === 'JSON')
              .map((file) => {
                return {
                  path: file.path,
                  data: JSON.parse(file.data as string),
                }
              }),
            // DDF file
            [
              {
                path: bundle.data.name,
                data: JSON.parse(bundle.data.ddfc),
              },
            ],
          )

          if (validationResult.length === 0) {
            bundle.data.validation = {
              result: 'success',
              version: validator.version,
            }
          }
          else {
            const errors: {
              message: string
              path: (string | number)[]
            }[] = []

            validationResult.forEach(({ path, error }) => {
              if (error instanceof ZodError) {
                fromZodError(error).details.forEach((detail) => {
                  errors.push({
                    path: [path, ...detail.path],
                    message: detail.message,
                  })
                })
              }
              else {
                errors.push({
                  path: [path],
                  message: error.toString(),
                })
              }
            })

            bundle.data.validation = {
              result: 'error',
              version: validator.version,
              errors,
            }
          }
        }

        let encoded = encode(bundle)

        if (privateKey)
          encoded = await sign(encoded, [{ key: hexToBytes(privateKey) }])

        if (output) {
          const outputPath = path.join(output, bundle.data.name)
          await fs.writeFile(outputPath, encoded.stream())
          console.log(output)
        }

        if (upload) {
          const client = createDirectus(storeUrl!).with(staticToken(storeToken!)).with(rest())
          const uuid = uuidv4()

          const formData = new FormData()
          formData.append('tag', tag)
          formData.append(uuid, encoded)

          const { result } = await client.request<
          // TODO import type from the store extension
          { result: Record<string, {
            success: boolean
            createdId?: PrimaryKey | undefined
            message?: string | undefined
          }> }
          >(() => {
            return {
              method: 'POST',
              path: '/bundle/upload',
              body: formData,
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          })

          if (result[uuid].success === true)
            console.log(`[${bundle.data.name}] uploaded successfully`)
          else
            console.log(`[${bundle.data.name}] failed to upload : ${result[uuid].message}`)
        }
      }))
    })
}
