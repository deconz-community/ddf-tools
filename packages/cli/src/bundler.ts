/* eslint-disable no-console */
import path from 'node:path'
import fs from 'node:fs/promises'
import { program } from '@commander-js/extra-typings'
import glob from 'fast-glob'
import type { Source, ValidationError } from '@deconz-community/ddf-bundler'
import { buildFromFiles, createSource, encode, sign } from '@deconz-community/ddf-bundler'
import { hexToBytes } from '@noble/hashes/utils'
import { createValidator } from '@deconz-community/ddf-validator'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'
import { createDirectus, rest, staticToken } from '@directus/sdk'
import { v4 as uuidv4 } from 'uuid'
import type { PrimaryKey } from '@directus/types'
import { simpleGit } from 'simple-git'

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
    .option('--store-url <url>', 'Use a custom store URL instead of the default')
    .option('--store-token <token>', 'Authentication token')
    .option('--store-bundle-status <status>', 'Status of the bundle (alpha, beta, stable)', 'alpha')
    .option('--file-modified-method <method>', 'Method to use to get the last modified date of the files (gitlog, mtime, ctime)', 'gitlog')
    .action(async (input, options) => {
      const {
        generic,
        output,
        validate,
        privateKey,
        upload,
        storeUrl,
        storeToken,
        storeBundleStatus,
        fileModifiedMethod,
      } = options

      // #region Validate options
      if (upload && (!storeUrl || !storeToken)) {
        console.error('You must provide both --store-url and --store-token when using --upload')
        return
      }

      {
        const genericStat = await fs.stat(generic)
        if (!genericStat.isDirectory()) {
          console.error('generic must be a directory')
          return
        }
      }

      if (!upload && !output) {
        console.error('You must provide either --upload or --output')
        return
      }

      if (output) {
        const outputStat = await fs.stat(output)
        if (!outputStat.isDirectory()) {
          console.error('output must be a directory')
          return
        }
      }

      if (!['alpha', 'beta', 'stable'].includes(storeBundleStatus)) {
        console.error('store-bundle-status must be either alpha, beta or stable')
        return
      }
      // #endregion

      // #region Utils methods
      async function findGitDirectory(filePath: string): Promise<string | undefined> {
        const directoryPath = path.dirname(filePath)

        try {
          await fs.access(path.join(directoryPath, '.git'))
          return directoryPath
        }
        catch {
          const parentDirectory = path.dirname(directoryPath)
          if (parentDirectory === directoryPath)
            return undefined

          return findGitDirectory(directoryPath)
        }
      }

      const getLastModified = async (filePath: string) => {
        switch (fileModifiedMethod) {
          case 'gitlog': {
            const gitDirectory = await findGitDirectory(filePath)
            if (gitDirectory === undefined) {
              console.warn(`No .git directory found for ${filePath}. Using mtime instead.`)
              return (await fs.stat(filePath)).mtime
            }

            const git = simpleGit(gitDirectory)
            const log = await git.log({ file: filePath })

            const status = await git.status()
            if (status.modified.some(file => filePath.endsWith(file))) {
              console.warn(`File modified since last commit for ${filePath}. Using mtime instead.`)
              return (await fs.stat(filePath)).mtime
            }

            const latestCommit = log.latest
            if (latestCommit === null) {
              console.warn(`No commit found for ${filePath}. Using mtime instead.`)
              return (await fs.stat(filePath)).mtime
            }

            return new Date(latestCommit.date)
          }
          case 'mtime': {
            return (await fs.stat(filePath)).mtime
          }
          case 'ctime': {
            return (await fs.stat(filePath)).atime
          }
        }

        return new Date()
      }

      // #endregion

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

      const sources = new Map<string, Source>()

      await Promise.all(inputFiles.map(async (inputFile) => {
        const inputFilePath = path.resolve(inputFile)

        if (inputFilePath.startsWith(genericDirectoryPath)) {
          // console.log(`Skipping DDF file [${inputFile}] because it's inside the generic directory`)
          return
        }

        const bundle = await buildFromFiles(
          `file://${genericDirectoryPath}`,
          `file://${inputFilePath}`,
          async (path) => {
            if (sources.has(path))
              return sources.get(path)!
            const filePath = path.replace('file://', '')
            const data = await fs.readFile(filePath)
            const source = createSource(new Blob([data]), {
              path,
              last_modified: await getLastModified(filePath),
            })
            sources.set(path, source)
            return source
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
            const errors: ValidationError[] = []

            validationResult.forEach(({ path, error }) => {
              if (error instanceof ZodError) {
                fromZodError(error).details.forEach((detail) => {
                  errors.push({
                    type: 'code',
                    message: detail.message,
                    file: path,
                    path: detail.path,
                  })
                })
              }
              else {
                errors.push({
                  type: 'simple',
                  message: error.toString(),
                  file: path,
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

          // TODO: use this : https://github.com/directus/directus/blob/main/sdk/src/rest/helpers/custom-endpoint.ts
          const { result } = await client.request<
          // TODO: import type from the store extension
          { result: Record<string, {
            success: boolean
            createdId?: PrimaryKey | undefined
            message?: string | undefined
          }> }
          >(() => {
            return {
              method: 'POST',
              path: `/bundle/upload/${storeBundleStatus}`,
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
