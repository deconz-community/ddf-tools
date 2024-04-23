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
    .option('--private-key <privateKey>', 'Comma seperated list of private key to sign the bundle with')
    .option('--upload', 'Upload the bundle to the store after creating it')
    .option('--store-url <url>', 'Store URL')
    .option('--store-token <token>', 'Authentication token')
    .action(async (input, options) => {
      const {
        generic,
        output,
        validate,
        privateKey,
        upload = false,
        storeUrl,
        storeToken,
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
          console.warn('Input must be a file or directory')
          return
        }
      }
      const genericDirectoryPath = path.resolve(generic)

      const bundleToUpload: Record<string, {
        name: string
        encoded: Blob
      }> = {}

      await Promise.all(inputFiles.map(async (inputFile) => {
        const inputFilePath = path.resolve(inputFile)

        if (inputFilePath.startsWith(genericDirectoryPath)) {
          // console.log(`Skipping DDF file [${inputFile}] because it's inside the generic directory`)
          return
        }

        const bundle = await buildFromFiles(
          `file://${genericDirectoryPath}`,
          `file://${inputFilePath}`,
          async (filePath) => {
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

        if (privateKey) {
          for (const key of privateKey.split(','))
            encoded = await sign(encoded, [{ key: hexToBytes(key) }])
        }

        if (output) {
          const outputPath = path.join(output, bundle.data.name)
          await fs.writeFile(outputPath, encoded.stream())
        }

        if (upload) {
          bundleToUpload[uuidv4()] = {
            name: bundle.data.name,
            encoded,
          }
        }
      }))

      if (upload) {
        const client = createDirectus(storeUrl!).with(staticToken(storeToken!)).with(rest())

        const entries = Object.entries(bundleToUpload)

        const CHUNK_SIZE = 10
        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
          console.log(`Processing chunk #${(i / CHUNK_SIZE) + 1}`)
          const chunk = entries.slice(i, i + CHUNK_SIZE)

          const formData = new FormData()
          for (const [uuid, { encoded }] of chunk)
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

          for (const [uuid, { name }] of chunk) {
            if (result[uuid].success === true)
              console.log(`[${name}] uploaded successfully`)
            else
              console.log(`[${name}] failed to upload : ${result[uuid].message}`)
          }
        }
      }
    })
}
