import antfu from '@antfu/eslint-config'

export default await antfu(
  {

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },

    // Enable stylistic formatting rules
    // stylistic: true,

    // Or customize the stylistic rules
    stylistic: {
      indent: 2, // 4, or 'tab'
      quotes: 'single', // or 'double'
    },

    // `.eslintignore` is no longer supported in Flat config, use `ignores` instead
    ignores: [
      '.history',
      '.vscode',
      '.coverage',
      'dist',
      'node_modules',
      'test-data',
    ],

  },
)
