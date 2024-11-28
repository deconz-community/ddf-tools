import { readFile } from 'node:fs/promises'
import { program } from '@commander-js/extra-typings'
import { createValidator } from '@deconz-community/ddf-validator'
import chalk from 'chalk'
import glob from 'fast-glob'
import ora from 'ora'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

interface FileDefinition {
  path: string
  data: Record<string, unknown>
}

export function validateCommand() {
  program
    .command('validate')
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

      const genericFiles: FileDefinition[] = []
      const ddfFiles: FileDefinition[] = []

      await Promise.all(files.map(
        async (path) => {
          const file: FileDefinition = { path, data: {} }

          try {
            const data = await readFile(path, 'utf-8')
            file.data = JSON.parse(data)
            if (file.data && 'ddfvalidate' in file.data && file.data.ddfvalidate === false && skip) {
              spinner.stop()
              console.log(chalk.yellow(`Skipping file ${file.path} because it has the ddfvalidate option set to false`))
              spinner.start()
              return
            }
          }
          catch (error) {
            spinner.stop()
            const message = error instanceof Error ? error.message : 'Unknown error'
            console.log(chalk.red(`Error parsing file ${file.path}, it's not a valid JSON file; ${message}`))
            spinner.start()
            return
          }

          if ('schema' in file.data && typeof file.data.schema === 'string') {
            if (validator.isGeneric(file.data.schema))
              return genericFiles.push(file)
            else if (validator.isDDF(file.data.schema))
              return ddfFiles.push(file)
          }

          spinner.stop()
          console.log(chalk.yellow(`Unknown schema for file ${file.path}${file.data.schema ? `, got '${file.data.schema}'` : ''}`))
          spinner.start()
        },
      ))
      spinner.text = chalk.blue(`Loaded ${genericFiles.length} generic files and ${ddfFiles.length} DDF files from disk`)
      spinner.succeed()

      const plural = (singular: string, plural: string, count: number) => count > 1 ? plural : singular
      const typeFilesText = (type: string, count: number) => `${type} ${plural('file', 'files', count)}`

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
              if (error instanceof ZodError) {
                message = fromZodError(error, {
                  issueSeparator: '\n    ',
                  prefix: null,
                }).message
              }
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
