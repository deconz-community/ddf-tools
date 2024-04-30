#!/usr/bin/env node

// See https://github.com/directus/directus/issues/21745#issuecomment-2067801020

const { exec } = require('node:child_process')
const watch = require('node-watch')

const filePath = '../store/package.json'

const extensions = [
  'store-extension',
]

watch(extensions.map(extension => [
    `../${extension}/dist/`,
]).flat(), {
  recursive: true,
}, (evt, name) => {
  exec(`touch ${filePath}`, (error) => {
    if (error) {
      console.error(`Error executing command: ${error}`)
      return
    }

    extensions.filter(extension => name.includes(extension)).forEach((extension) => {
      console.log(`Extension ${extension} changed.`)
    })
  })
})
