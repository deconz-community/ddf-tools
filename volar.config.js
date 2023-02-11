module.exports = {
  plugins: [
    require('@volar-plugins/prettyhtml')({ printWidth: 100 }),
    require('@volar-plugins/prettier')({
      languages: ['html', 'css', 'scss', 'typescript', 'javascript'],
      html: {
        breakContentsFromTags: true,
      },
      useVscodeIndentation: true,
    }),
  ],
}
