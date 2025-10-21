import type { Source, ValidationError } from '@deconz-community/ddf-bundler'
import type { PrimaryKey } from '@directus/types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { program } from '@commander-js/extra-typings'
import { buildFromFiles, createSource, encode, generateHash, sign } from '@deconz-community/ddf-bundler'
import { createValidator } from '@deconz-community/ddf-validator'
import { createDirectus, rest, serverHealth, staticToken } from '@directus/sdk'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import chalk from 'chalk'
import glob from 'fast-glob'
import ora from 'ora'
import { simpleGit } from 'simple-git'
import { v4 as uuidv4 } from 'uuid'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

export function bundleCommand() {
  program
    .command('bundle')
    .description('Create a bundle from a file')
    .argument('<path>', 'Source DDF file / directory')
    .option('-g, --generic <path>', 'Generic directory path, by default it will search for a generic directory in the source directory')
    .option('-o, --output <path>', 'Output directory path')
    .option('--no-validate', 'Disable validation of the DDF file')
    .option('--private-key <privateKey>', 'Comma seperated list of private key to sign the bundle with')
    .option('--upload', 'Upload the bundle to the store after creating it', false)
    .option('--store-url <url>', 'Use a custom store URL instead of the default', 'https://ddf.cryonet.io')
    .option('--store-token <token>', 'Authentication token')
    .option('--store-bundle-status <status>', 'Status of the bundle (alpha, beta, stable)', 'alpha')
    .option('--file-modified-method <method>', 'Method to use to get the last modified date of the files (gitlog, mtime, ctime)', 'gitlog')
    .option('--debug', 'Enable debug log', false)
    .action(async (input, options) => {
      const {
        output,
        generic,
        validate,
        privateKey,
        upload,
        storeUrl,
        storeToken,
        storeBundleStatus,
        fileModifiedMethod,
        debug,
      } = options

      const spinner = ora(chalk.blue('Starting Bundler')).start()
      const log = (text: string) => {
        if (spinner.isSpinning) {
          spinner.clear()
          console.log(text)
          spinner.start()
        }
        else {
          console.log(text)
        }
      }

      // #region Validate options
      if (upload && (!storeUrl || !storeToken)) {
        spinner.fail(chalk.red('You must provide both --store-url and --store-token when using --upload'))
        return
      }

      if (!upload && !output) {
        spinner.fail(chalk.red('You must provide either --upload or --output'))
        return
      }

      if (output) {
        const outputStat = await fs.stat(output)
        if (!outputStat.isDirectory()) {
          spinner.fail(chalk.red('output must be a directory'))
          return
        }
      }

      if (generic) {
        try {
          const genericStat = await fs.stat(generic)
          if (!genericStat.isDirectory()) {
            spinner.fail(chalk.red('generic must be a directory'))
            return
          }
        }
        catch {
          spinner.fail(chalk.red('generic directory does not exist'))
          return
        }
      }

      if (!['alpha', 'beta', 'stable'].includes(storeBundleStatus)) {
        spinner.fail(chalk.red('store-bundle-status must be either alpha, beta or stable'))
        return
      }
      // #endregion

      // #region Utils methods
      async function findGenericDirectory(filePath: string): Promise<string | undefined> {
        const directoryPath = path.dirname(filePath)

        try {
          await fs.access(path.join(directoryPath, 'generic', 'constants.json'))
          return path.join(directoryPath, 'generic')
        }
        catch {
          const parentDirectory = path.dirname(directoryPath)
          if (parentDirectory === directoryPath)
            return undefined

          return findGenericDirectory(directoryPath)
        }
      }

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
        const resolvedFilePath = path.resolve(filePath)

        // return new Date(1675344959000) // Thu Feb 02 2023 14:35:59 GMT+0100
        // return new Date(1696250159000) // Mon Oct 02 2023 14:35:59 GMT+0200
        // return new Date()
        switch (fileModifiedMethod) {
          case 'gitlog': {
            const gitDirectory = await findGitDirectory(resolvedFilePath)
            if (gitDirectory === undefined) {
              log(chalk.yellow(`No .git directory found for ${resolvedFilePath}. Using mtime instead.`))
              return (await fs.stat(resolvedFilePath)).mtime
            }

            if (debug)
              log(`Finding git log datetime for file '${resolvedFilePath}' in git directory '${gitDirectory}'`)

            const git = simpleGit(gitDirectory)
            const gitLog = await git.log({ file: resolvedFilePath })

            const status = await git.status()
            if (status.modified.some(file => resolvedFilePath.endsWith(file))) {
              log(chalk.yellow(`File modified since last commit for ${resolvedFilePath}. Using mtime instead.`))
              return (await fs.stat(resolvedFilePath)).mtime
            }

            const latestCommit = gitLog.latest
            if (latestCommit === null) {
              log(chalk.yellow(`No commit found for ${resolvedFilePath}. Using mtime instead.`))
              return (await fs.stat(resolvedFilePath)).mtime
            }

            if (debug)
              log(`Found git log datetime for file '${resolvedFilePath}' : '${latestCommit.date}'`)

            return new Date(latestCommit.date)
          }
          case 'mtime': {
            return (await fs.stat(resolvedFilePath)).mtime
          }
          case 'ctime': {
            return (await fs.stat(resolvedFilePath)).atime
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
          spinner.fail(chalk.red('Input must be a file or directory'))
          return
        }
      }

      if (inputFiles.length === 0) {
        spinner.fail(chalk.red('No input files found'))
        return
      }

      inputFiles.sort((a, b) => a.localeCompare(b))

      spinner.start(chalk.blue(`Loading ${inputFiles.length} files from disk`))

      let genericDirectoryPath = generic ?? await findGenericDirectory(inputFiles[0])

      if (genericDirectoryPath === undefined) {
        spinner.fail(chalk.red('No generic directory found'))
        return
      }

      genericDirectoryPath = path.resolve(genericDirectoryPath)

      if (debug)
        log(`Using generic directory '${genericDirectoryPath}'`)

      const fileToProcess = inputFiles
        .map(file => path.resolve(file))
        .filter(file => !file.startsWith(genericDirectoryPath))

      const bundleToUpload: Record<string, {
        name: string
        encoded: Blob
        hash: string
      }> = {}

      const sources = new Map<string, Source>()

      for (const [index, inputFilePath] of fileToProcess.entries()) {
        spinner.text = chalk.blue(`Processing file #${index + 1}/${fileToProcess.length}`)

        if (debug)
          log(`Bundling file '${inputFilePath}'`)

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

            bundle.data.files
              .filter(file => file.type === 'DDFC')
              .map((file) => {
                return {
                  path: file.path,
                  data: JSON.parse(file.data as string),
                }
              }),
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
                    path: [detail.path.join('/')],
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

        bundle.data.hash = await generateHash(bundle.data)
        const hash = bytesToHex(bundle.data.hash)

        if (output) {
          const outputPath = path.join(output, `${bundle.data.name}-${hash.substring(0, 8)}.ddb`)
          await fs.writeFile(outputPath, encoded.stream())

          spinner.clear()
          spinner.info(chalk.green(`[${inputFilePath.replace(`${process.cwd()}/`, '')}] written to ${outputPath}`))
          spinner.start()
        }

        if (upload) {
          bundleToUpload[uuidv4()] = {
            name: bundle.data.name,
            encoded,
            hash,
          }

          spinner.clear()
          spinner.info(chalk.green(`[${inputFilePath.replace(`${process.cwd()}/`, '')}] added to the upload list`))
          spinner.start()
        }
      }

      if (upload) {
        const CHUNK_SIZE = 10

        spinner.start(chalk.blue(`Uploading bundles to the store by group of ${CHUNK_SIZE}`))
        const client = createDirectus(storeUrl!).with(staticToken(storeToken!)).with(rest())

        try {
          const health = await client.request(serverHealth())
          if (health.status !== 'ok') {
            spinner.fail(chalk.red('Error while connecting to the store'))
            log(chalk.red(JSON.stringify(health)))
            return
          }
        }
        catch (error) {
          spinner.fail(chalk.red('Error while connecting to the store'))
          log(chalk.red(JSON.stringify(error)))
          return
        }

        const entries = Object.entries(bundleToUpload)
        let errorCount = 0

        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
          spinner.text = chalk.blue(`Processing chunk #${(i / CHUNK_SIZE) + 1}`)
          const chunk = entries.slice(i, i + CHUNK_SIZE)

          const formData = new FormData()
          for (const [uuid, { encoded }] of chunk)
            formData.append(uuid, encoded)

          // TODO: use this : https://github.com/directus/directus/blob/main/sdk/src/rest/helpers/custom-endpoint.ts
          try {
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
              if (result[uuid].success === true) {
                spinner.info(chalk.green(`[${name}] uploaded successfully at ${storeUrl}/bundle/download/${result[uuid].createdId}`))
              }
              else {
                errorCount++
                log(chalk.red(`[${name}] failed to upload : ${result[uuid].message}`))
              }
            }
          }
          catch (error) {
            spinner.fail(chalk.red('Failed to upload bundles'))
            console.error(error)
          }
        }

        if (errorCount === 0)
          spinner.succeed(chalk.green('All bundles uploaded successfully'))
        else
          spinner.fail(chalk.red(`${errorCount} bundles failed to upload`))
      }

      spinner.succeed(chalk.green('Bundler finished'))
    })
}
