import { readFile } from 'fs/promises'
import { describe, expect, test } from 'vitest'
import glob from 'glob'
import { fromZodError } from 'zod-validation-error'
import { validate } from '../index'

describe('parse', async () => {
  const jsonfiles = await glob('test-data/**/*.json', { ignore: '**/generic/**' })
  jsonfiles.forEach((filePath) => {
    test(`should parse file ${filePath}`, async () => {
      const data = await readFile(filePath, 'utf-8')
      const decoded = JSON.parse(data)
      try {
        const result = validate(decoded)
        expect(result).toBeDefined()
      }
      catch (error) {
        throw new Error(fromZodError(error).message)
      }
    })
  })
})
