import { readFile } from 'fs/promises'
import { describe, expect, it } from 'vitest'
import glob from 'glob'
import { fromZodError } from 'zod-validation-error'
import { ddfSchema } from '../index'

describe('parse', async () => {
  const jsonfiles = await glob('test-data/devices/**/*.json')
  const schema = ddfSchema()

  describe.each(jsonfiles)('should parse file', (filePath) => {
    it(`should parse file ${filePath}`, async () => {
      const data = await readFile(filePath, 'utf-8')
      const decoded = JSON.parse(data)
      const result = schema.safeParse(decoded)
      if (result.success === false)
        throw new Error(fromZodError(result.error).message)
      expect(result.success).toBeTruthy()
    })
  })
})
