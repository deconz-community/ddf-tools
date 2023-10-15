/* eslint-disable no-console */
import { readFile } from 'node:fs/promises'
import { program } from 'commander'
import glob from 'fast-glob'
import { createValidator } from '@deconz-community/ddf-validator'
import { fromZodError } from 'zod-validation-error'
import chalk from 'chalk'
import ora from 'ora'

export function validator() {
  program
    .command('validator')
    .description('Validate DDF files')
    .requiredOption('-d, --directory <path>', 'Directory to validate')
    .option('--no-skip', 'Validate all files even if they have the ddfvalidate option to false')
    .action(async (options) => {
      const { directory, skip } = options
      const validator = createValidator()

      console.log(chalk.green(`- Using validator version ${validator.version}`))
      const spinner = ora(chalk.blue('Finding files to validate')).start()
      const files = await glob(`${directory}/**/*.json`)
      spinner.text = chalk.blue(`Found ${files.length} files to validate`)
      spinner.succeed()

      spinner.start(chalk.blue(`Loading ${files.length} files from disk`))

      const genericFiles = []
      const ddfFiles = []

      await Promise.all(files.map(
        async (path) => {
          const file = { path, data: undefined }

          try {
            const data = await readFile(path, 'utf-8')
            file.data = JSON.parse(data)
            if ('ddfvalidate' in file.data && file.data.ddfvalidate === false && skip) {
              spinner.stop()
              console.log(chalk.yellow(`Skipping file ${file.path} because it has the ddfvalidate option set to false`))
              spinner.start()
              return
            }
          }
          catch (e) {
            spinner.stop()
            console.log(chalk.red(`Error parsing file ${file.path}, it's not a valid JSON file; ${e.toString()}`))
            spinner.start()
            return
          }

          if (validator.isGeneric(file.data.schema)) {
            genericFiles.push(file)
          }
          else if (validator.isDDF(file.data.schema)) {
            ddfFiles.push(file)
          }
          else {
            spinner.stop()
            console.log(chalk.yellow(`Unknown schema for file ${file.path}${file.data.schema ? `, got '${file.data.schema}'` : ''}`))
            spinner.start()
          }
        },
      ))
      spinner.text = chalk.blue(`Loaded ${genericFiles.length} generic files and ${ddfFiles.length} DDF files from disk`)
      spinner.succeed()

      const plural = (singular, plural, count) => count > 1 ? plural : singular
      const typeFilesText = (type, count) => `${type} ${plural('file', 'files', count)}`

      validator.bulkValidate(genericFiles, ddfFiles, {
        onSectionStart: (type, total) => {
          spinner.start(chalk.blue(`Parsing ${typeFilesText(type, total)} 1 of ${total}`))
        },
        onSectionProgress: (type, current, total) => {
          spinner.text = chalk.blue(`Parsing ${typeFilesText(type, total)} ${current} of ${total}`)
          spinner.render()
        },
        onSectionEnd(type, total, errorFiles) {
          if (errorFiles.length === 0)
            return spinner.succeed(chalk.green(`No errors found in ${total} ${typeFilesText(type, total)}`))

          spinner.fail(chalk.red(`Found ${errorFiles.length} ${plural('error', 'errors', errorFiles.length)} in ${total} ${typeFilesText(type, total)}`))

          errorFiles.forEach(({ path, error }) => {
            /*
            if (path === './test-data/tuya/_TZ3000_4fjiwweb_smart_knob.json')
              console.log(error.errors)
            */

            let message = ''
            try {
              message = fromZodError(error, {
                issueSeparator: '\n    ',
                prefix: null,
              }).message
            }
            catch (e) {
              message = error.toString()
            }
            console.log(`  ${chalk.cyan('File:')}`, path)
            console.log(`    ${chalk.red(message)}`)
          })
        },
      })
    })
}
