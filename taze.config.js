import { defineConfig } from 'taze'

export default defineConfig({
  mode: 'major',
  recursive: true,

  // fetch latest package info from registry without cache
  force: true,
  // write to package.json
  write: true,
  // run `npm install` or `yarn install` right after bumping
  install: true,
  // override with different bumping mode for each package
  packageMode: {
    '@types/node': 'minor',
  },
  // include locked and dev dependencies in the result
  includeLocked: true,
})
