/* eslint-disable no-console */
import { program } from '@commander-js/extra-typings'

export function validator() {
  program
    .command('store')
    .description('Upload DDF files to the store')
    .argument('<file>', 'File to upload.')
    .requiredOption('-u, --url <url>', 'Store URL')
    .requiredOption('-t, --token <token>', 'Authentication token')
    .option('--tag <tag>', 'Registers the published bundle with the given tag. By default, the "latest" tag is used.')
    .action(async (file, options) => {
      const { url, token, tag = 'latest' } = options
      console.log({ url, token, tag, file })
    })
}
