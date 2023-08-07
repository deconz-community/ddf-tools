// eslint-disable-next-line @typescript-eslint/no-var-requires
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
