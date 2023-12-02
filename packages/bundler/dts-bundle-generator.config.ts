import packageJson from './package.json'

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
