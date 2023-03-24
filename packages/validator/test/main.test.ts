import { readFile } from 'fs/promises'
import { describe, expect, test } from 'vitest'
import glob from 'glob'
import { fromZodError } from 'zod-validation-error'

import { createValidator } from '../index'

describe('parse', async () => {
  const genericFiles = await glob('test-data/generic/**/*.json')
  const ddfFiles = await glob('test-data/**/*.json', {
    ignore: '**/generic/**',
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
    genericFilesData.sort((a, b) => a.data.schema.localeCompare(b.data.schema))

    genericFilesData.forEach((file) => {
      test(`should load generic file ${file.path}`, () => {
        try {
          const result = validator.loadGeneric(file.data)
          expect(result).toBeDefined()
        }
        catch (error) {
          throw new Error(fromZodError(error).message)
        }
      })
    })
  })

  describe('should validate DDF', async () => {
    ddfFiles.forEach((filePath) => {
      test(`validating ${filePath}`, async () => {
        const data = await readFile(filePath, 'utf-8')
        const decoded = JSON.parse(data)

        try {
          const result = validator.validate(decoded)
          expect(result).toBeDefined()
        }
        catch (error) {
          throw new Error(fromZodError(error).message)
        }
      })
    })
  })
})
