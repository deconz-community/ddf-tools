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

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T/

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

      function getCommonParentDirectory(pathA: string, pathB: string): string {
        const a = path.resolve(pathA).split(path.sep)
        const b = path.resolve(pathB).split(path.sep)
        const length = Math.min(a.length, b.length)
        const common: string[] = []

        for (let i = 0; i < length; i++) {
          if (a[i] !== b[i])
            break
          common.push(a[i])
        }

        if (common.length === 0)
          return path.parse(pathA).root

        return common.join(path.sep) || path.parse(pathA).root
      }

      const gitDateMaps = new Map<string, Map<string, Date>>()
      const gitModifiedSets = new Map<string, Set<string>>()
      const gitDateMapPromises = new Map<string, Promise<{ dateMap: Map<string, Date>, modifiedSet: Set<string> }>>()

      async function buildGitDateMap(gitDirectory: string): Promise<{ dateMap: Map<string, Date>, modifiedSet: Set<string> }> {
        if (gitDateMaps.has(gitDirectory))
          return { dateMap: gitDateMaps.get(gitDirectory)!, modifiedSet: gitModifiedSets.get(gitDirectory)! }

        if (gitDateMapPromises.has(gitDirectory))
          return gitDateMapPromises.get(gitDirectory)!

        const buildPromise = (async () => {
          const git = simpleGit(gitDirectory)

          const [rawLog, status] = await Promise.all([
            git.raw(['log', '--name-only', '--pretty=format:%cI', '--diff-filter=ACRM']),
            git.status(),
          ])

          const dateMap = new Map<string, Date>()
          let currentDate: Date | null = null
          for (const line of rawLog.split('\n')) {
            if (!line)
              continue
            // ISO date line (starts with a digit and contains 'T')
            if (ISO_DATE_RE.test(line)) {
              currentDate = new Date(line)
            }
            else if (currentDate !== null && !dateMap.has(line)) {
              // First occurrence = most recent commit for this file
              dateMap.set(line, currentDate)
            }
          }

          const modifiedSet = new Set<string>([
            ...status.modified,
            ...status.not_added,
            ...status.created,
            ...status.deleted,
            ...status.renamed.map(r => (typeof r === 'string' ? r : r.to)),
          ])

          gitDateMaps.set(gitDirectory, dateMap)
          gitModifiedSets.set(gitDirectory, modifiedSet)

          if (debug)
            log(`Built git date map for '${gitDirectory}': ${dateMap.size} entries`)

          return { dateMap, modifiedSet }
        })()

        gitDateMapPromises.set(gitDirectory, buildPromise)

        try {
          return await buildPromise
        }
        finally {
          gitDateMapPromises.delete(gitDirectory)
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

            const relativeFilePath = path.relative(gitDirectory, resolvedFilePath).split(path.sep).join('/')
            const { dateMap, modifiedSet } = await buildGitDateMap(gitDirectory)

            if (modifiedSet.has(relativeFilePath)) {
              log(chalk.yellow(`File modified since last commit for ${resolvedFilePath}. Using mtime instead.`))
              return (await fs.stat(resolvedFilePath)).mtime
            }

            const date = dateMap.get(relativeFilePath)
            if (date === undefined) {
              log(chalk.yellow(`No commit found for ${resolvedFilePath}. Using mtime instead.`))
              return (await fs.stat(resolvedFilePath)).mtime
            }

            return date
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

      const validationErrorsByAbsolutePath = new Map<string, ValidationError[]>()
      let validatorVersion = 'unknown'

      if (validate) {
        spinner.start(chalk.blue('Pre-validating source files'))

        const validator = createValidator()
        validatorVersion = validator.version

        const genericJsonFiles = (await glob(`${genericDirectoryPath}/**/*.json`)).map(file => path.resolve(file))
        const allValidationFiles = Array.from(new Set([...fileToProcess, ...genericJsonFiles]))

        const genericDefinitions: { path: string, data: unknown }[] = []
        const ddfDefinitions: { path: string, data: unknown }[] = []

        for (const absoluteFilePath of allValidationFiles) {
          try {
            const rawData = await fs.readFile(absoluteFilePath, 'utf8')
            const parsedData = JSON.parse(rawData) as Record<string, unknown>
            const schema = parsedData.schema

            if (typeof schema === 'string' && validator.isGeneric(schema))
              genericDefinitions.push({ path: absoluteFilePath, data: parsedData })
            else if (typeof schema === 'string' && validator.isDDF(schema))
              ddfDefinitions.push({ path: absoluteFilePath, data: parsedData })
          }
          catch (error) {
            validationErrorsByAbsolutePath.set(absoluteFilePath, [{
              type: 'simple',
              message: error instanceof Error ? error.message : String(error),
              file: absoluteFilePath,
            }])
          }
        }

        const validationResults = validator.bulkValidate(genericDefinitions, ddfDefinitions)

        const toValidationErrors = (entry: { path: string, error: Error | ZodError }): ValidationError[] => {
          if (entry.error instanceof ZodError) {
            return fromZodError(entry.error).details.map(detail => ({
              type: 'code',
              message: detail.message,
              file: entry.path,
              path: [detail.path.join('/')],
            }))
          }

          return [{
            type: 'simple',
            message: entry.error.toString(),
            file: entry.path,
          }]
        }

        for (const entry of validationResults) {
          const existing = validationErrorsByAbsolutePath.get(entry.path) ?? []
          validationErrorsByAbsolutePath.set(entry.path, [...existing, ...toValidationErrors(entry)])
        }
      }

      const bundleToUpload: Record<string, {
        name: string
        encoded: Blob
        hash: string
      }> = {}

      // Storing Promises prevents duplicate git log calls when concurrent bundles
      // request the same generic file before either finishes loading it.
      const sourcePromises = new Map<string, Promise<Source>>()

      function getOrCreateSource(urlPath: string): Promise<Source> {
        if (sourcePromises.has(urlPath))
          return sourcePromises.get(urlPath)!
        const filePath = urlPath.replace('file://', '')
        const promise = fs.readFile(filePath).then(async (data) => {
          const last_modified = await getLastModified(filePath)
          return createSource(new Blob([data]), { path: urlPath, last_modified })
        })
        sourcePromises.set(urlPath, promise)
        return promise
      }

      // Pre-warm sources for all DDF input files in parallel.
      await Promise.all(fileToProcess.map(filePath => getOrCreateSource(`file://${filePath}`)))

      const CONCURRENCY = 8
      let completed = 0

      const processBundle = async (inputFilePath: string, index: number) => {
        spinner.text = chalk.blue(`Processing file #${index + 1}/${fileToProcess.length}`)

        if (debug)
          log(`Bundling file '${inputFilePath}'`)

        const bundle = await buildFromFiles(
          `file://${genericDirectoryPath}`,
          `file://${inputFilePath}`,
          urlPath => getOrCreateSource(urlPath),
        )

        if (validate) {
          const bundleRoot = getCommonParentDirectory(genericDirectoryPath, path.dirname(inputFilePath))
          const errors: ValidationError[] = []

          bundle.data.files
            .filter(file => file.type === 'JSON' || file.type === 'DDFC')
            .forEach((file) => {
              const absoluteFilePath = path.resolve(bundleRoot, file.path)
              const fileErrors = validationErrorsByAbsolutePath.get(absoluteFilePath)

              if (fileErrors !== undefined) {
                fileErrors.forEach((error) => {
                  if (error.type === 'code') {
                    errors.push({
                      ...error,
                      file: file.path,
                    })
                  }
                  else {
                    errors.push({
                      ...error,
                      file: file.path,
                    })
                  }
                })
              }

              if (file.path === 'generic/constants_min.json') {
                const constantsPath = path.join(genericDirectoryPath, 'constants.json')
                const constantsErrors = validationErrorsByAbsolutePath.get(constantsPath)
                if (constantsErrors !== undefined) {
                  constantsErrors.forEach((error) => {
                    if (error.type === 'code') {
                      errors.push({
                        ...error,
                        file: file.path,
                      })
                    }
                    else {
                      errors.push({
                        ...error,
                        file: file.path,
                      })
                    }
                  })
                }
              }
            })

          if (errors.length === 0) {
            bundle.data.validation = {
              result: 'success',
              version: validatorVersion,
            }
          }
          else {
            bundle.data.validation = {
              result: 'error',
              version: validatorVersion,
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

        completed++
        spinner.text = chalk.blue(`Processed ${completed}/${fileToProcess.length} files`)
      }

      for (let i = 0; i < fileToProcess.length; i += CONCURRENCY) {
        await Promise.all(
          fileToProcess.slice(i, i + CONCURRENCY).map((filePath, j) => processBundle(filePath, i + j)),
        )
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
