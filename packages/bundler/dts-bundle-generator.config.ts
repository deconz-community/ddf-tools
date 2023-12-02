// eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
const packageJson = require('./package.json')

const config = {
  entries: [
    {
      filePath: './index.ts',
      outFile: packageJson.types,
      noCheck: false,
    },
  ],
}

module.exports = config
