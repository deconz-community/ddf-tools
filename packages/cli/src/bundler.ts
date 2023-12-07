/* eslint-disable no-console */
import path from 'node:path'
import fs from 'node:fs/promises'
import { program } from '@commander-js/extra-typings'
import glob from 'fast-glob'
import { buildFromFiles, encode, sign } from '@deconz-community/ddf-bundler'
import { hexToBytes } from '@noble/hashes/utils'

export function bundlerCommand() {
  program
    .command('bundler')
    .description('Create a bundle from a file')
    .argument('<path>', 'Source DDF file / directory')
    .requiredOption('-g, --generic <path>', 'Generic directory path')
    .option('-o, --output <path>', 'Output directory path')
    // .option('--no-validate', 'Disable validation of the DDF file')
    .option('--private-key <privateKey>', 'Private key to sign the bundle with')
    // .option('--upload', 'Upload the bundle to the store after creating it')
    // .option('--store-url <url>', 'Store URL')
    // .option('--store-token <token>', 'Authentication token')
    // .option('--tag <tag>', 'Registers the published bundle with the given tag. By default, the "latest" tag is used.')
    .action(async (input, options) => {
      const {
        generic,
        output = path.dirname(input),
        // validate,
        privateKey,
        /*
        upload = false,
        storeUrl,
        storeToken,
        tag = 'latest',
        */
      } = options

      // Validate options
      /*
      if (upload && (!storeUrl || !storeToken)) {
        console.log('You must provide both --store-url and --store-token when using --upload')
        return
      }
      */

      {
        const genericStat = await fs.stat(generic)
        if (!genericStat.isDirectory()) {
          console.log('generic must be a directory')
          return
        }
      }

      {
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
            const data = await fs.readFile(filePath.replace('file://', ''))
            return new Blob([data])
          },
        )

        /*
        if (validate) {
          // bundle.validate()
          bundle.data.validation = {
            result: 'skipped',
            version: '0.0.0',
          }
        }
        */

        const outputPath = path.join(output, bundle.data.name)

        let encoded = encode(bundle)

        if (privateKey)
          encoded = await sign(encoded, [{ key: hexToBytes(privateKey) }])

        await fs.writeFile(outputPath, encoded.stream())
      }))
    })
}
