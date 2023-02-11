// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('./package.json')

const getPackageName = () => {
  return packageJson.name
}

const config = {
  compilationOptions: {
    preferredConfigPath: './tsconfig.build.json',
  },
  entries: [
    {
      filePath: './src/index.ts',
      outFile: `./dist/${getPackageName()}.d.ts`,
      noCheck: false,
      output: {
        noBanner: true,
      },
    },
  ],
}

module.exports = config
