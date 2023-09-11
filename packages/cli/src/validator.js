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
      const validator = createValidator()

      const spinner = ora(chalk.blue('Finding files to validate')).start()
      const files = await glob(`${directory}/**/*.json`)
      spinner.text = chalk.blue(`Found ${files.length} files to validate`)
      spinner.succeed()

      spinner.start(chalk.blue(`Loading ${files.length} files from disk`))

      const genericFiles = []
      const ddfFiles = []

      await Promise.all(files.map(
        async (filePath) => {
          const data = await readFile(filePath, 'utf-8')
          const decoded = JSON.parse(data)
          const file = { path: filePath, data: decoded }
          if (validator.isGeneric(decoded.schema))
            genericFiles.push(file)
          else
            ddfFiles.push(file)
        },
      ))
      spinner.text = chalk.blue(`Loaded ${genericFiles.length} generic files and ${ddfFiles.length} DDF files from disk`)
      spinner.succeed()

      genericFiles.sort((a, b) => a.data.schema.localeCompare(b.data.schema))

      const plural = (singular, plural, count) => count > 1 ? plural : singular

      const processFiles = (files, type) => {
        let count = 0
        const errorsMessages = []
        const typeFilesText = `${type} ${plural('file', 'files', files.length)}`

        spinner.start(chalk.blue(`Parsing ${typeFilesText} (1/${files.length})`))

        files.forEach((file) => {
          spinner.text = chalk.blue(`Parsing ${typeFilesText} (${count++}/${files.length})`)
          spinner.render()

          try {
            if (type === 'generic')
              validator.loadGeneric(file.data)
            else if (type === 'ddf')
              validator.validate(file.data)
          }
          catch (error) {
            errorsMessages.push({
              path: file.path,
              message: fromZodError(error).message,
            })
          }
        })

        spinner.start()
        if (errorsMessages.length > 0) {
          spinner.fail(chalk.red(`Found ${errorsMessages.length} ${plural('error', 'errors', errorsMessages.length)} in ${files.length} ${typeFilesText}`))
          errorsMessages.forEach((message) => {
            console.log(`  ${chalk.cyan('File:')}`, message.path)
            console.log(`    ${chalk.red(message.message)}`)
          })
        }
        else {
          spinner.succeed(chalk.green(`No errors found in ${files.length} ${typeFilesText}`))
        }
      }

      processFiles(genericFiles, 'generic')
      processFiles(ddfFiles, 'ddf')

      /*

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
      */
    })
}
