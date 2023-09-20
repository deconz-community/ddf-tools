import { program } from 'commander'
import { toByteArray } from 'base64-js'
import { decode } from '@deconz-community/ddf-bundler'

export function bundler() {
  program
    .command('bundler')
    .description('Inspect DDF bundle')
    .requiredOption('-i, --inspect <data>', 'Inspect a bundle data is base64 encoded buffer')
    .action(async (options) => {
      const { inspect } = options

      try {
        const data = toByteArray(inspect)
        const bundle = await decode(new Blob([data]))
        console.log(JSON.stringify(bundle.data.desc))
      }
      catch (e) {
        console.error(e)
      }

      // const validator = createValidator()
    })
}
