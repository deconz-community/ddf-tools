import { readFile } from 'node:fs/promises'
import glob from 'fast-glob'
import { describe, expect } from 'vitest'
import { fromZodError } from 'zod-validation-error'

import { createValidator } from '../index'

describe('parse', async () => {
  const genericFiles = await glob('test-data/generic/**/*.json')
  const ddfFiles = await glob('test-data/**/*.json', {
    ignore: ['**/generic/**'],
  })

  const validator = createValidator()

  describe('should load generics', async () => {
    const genericFilesData = await Promise.all(genericFiles.map(
      async (filePath) => {
        const data = await readFile(filePath, 'utf-8')
        const decoded = JSON.parse(data)
        return { path: filePath, data: decoded }
      },
    ))

    // Sort to load consts first
    genericFilesData.sort((a, b) => {
      if (a.data.schema !== b.data.schema)
        return a.data.schema.localeCompare(b.data.schema)

      // Reverse the order to load state/airqualityppb before state/airquality
      return b.path.localeCompare(a.path)
    })

    it.each(genericFilesData)('should load generic file $path', (file) => {
      try {
        if ('ddfvalidate' in file.data && file.data.ddfvalidate === false)
          return
        const result = validator.loadGeneric(file.data)
        expect(result).toBeTruthy()
      }
      catch (error) {
        expect.unreachable(`${fromZodError(error, {
          prefixSeparator: '\n    ',
          issueSeparator: '\n    ',
        }).message}`)
      }
    })
  })

  describe('should validate DDF', async () => {
    it.each(ddfFiles)('validating \'%s\'', async (filePath) => {
      try {
        const data = await readFile(filePath, 'utf-8')
        const decoded = JSON.parse(data)
        if ('ddfvalidate' in decoded && decoded.ddfvalidate === false)
          return
        const result = validator.validate(decoded)
        expect(result).toBeDefined()
      }
      catch (error) {
        expect.unreachable(`${fromZodError(error, {
          prefixSeparator: '\n    ',
          issueSeparator: '\n    ',
        }).message}`)
      }
    })
  })
})
