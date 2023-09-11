/* eslint-disable no-console */
import { readFile } from 'node:fs/promises'
import { program } from '@commander-js/extra-typings'
import { glob } from 'glob'
import { createValidator } from '@deconz-community/ddf-validator'
import { fromZodError } from 'zod-validation-error'
import chalk from 'chalk'
import ora from 'ora'

export function validator() {
  program
    .command('validator')
    .requiredOption('-d, --directory <path>', 'Di')
    .action(async (options) => {
      const { directory } = options
      let spinner
      const validator = createValidator()

      spinner = ora(chalk.blue('Finding files to validate')).start()
      const files = await glob(`${directory}/**/*.json`)
      spinner.text = chalk.blue(`Found ${files.length} files to validate`)
      spinner.succeed()

      spinner = ora(chalk.blue(`Loading ${files.length} files from disk`)).start()

      const genericFiles = []
      const ddffiles = []

      await Promise.all(files.map(
        async (filePath) => {
          const data = await readFile(filePath, 'utf-8')
          const decoded = JSON.parse(data)
          const file = { path: filePath, data: decoded }

          switch (decoded.schema) {
            case 'constants1.schema.json':
              genericFiles.push(file)
              break

            case 'devcap1.schema.json':
              ddffiles.push(file)
              break

            default:
              throw new Error(`Unknown schema ${decoded.schema}`)
          }
        },
      ))
      spinner.succeed()

      const schemas = []
      filesData.sort((a, b) => a.data.schema.localeCompare(b.data.schema))

      filesData.forEach((file) => {
        if (!schemas.includes(file.data.schema))
          schemas.push(file.data.schema)
      })

      console.log(schemas)

      filesData.filter((file) => {
        try {
          validator.loadGeneric(file.data)
          return false
        }
        catch (error) {
          return true
        }
      }).forEach((file) => {
        try {
          validator.validate(file.data)
        }
        catch (error) {
          console.log(file.path)
          console.log(fromZodError(error).message)
        }
      })
    })
}
