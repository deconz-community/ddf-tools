#!/usr/bin/env ts-node

import fs from 'fs'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts'
import glob from 'glob'

import { createValidator } from './src/validator'

const schemaDirectory = './dist'

const validator = createValidator()
const genericFiles = glob.globSync('test-data/generic/**/*.json')

const genericFilesData = genericFiles.map((filePath) => {
  const data = fs.readFileSync(filePath, { encoding: 'utf-8' })
  const decoded = JSON.parse(data)
  return { path: filePath, data: decoded }
})

genericFilesData.sort((a, b) => a.data.schema.localeCompare(b.data.schema))
genericFilesData.forEach((file) => {
  validator.loadGeneric(file.data)
})

const schemaZod = validator.getSchema()

if (!fs.existsSync(schemaDirectory))
  fs.mkdirSync(schemaDirectory, { recursive: true })

const schemaJson = zodToJsonSchema(schemaZod, 'DDF')
fs.writeFileSync(
    `${schemaDirectory}/ddf-schema.json`,
    JSON.stringify(schemaJson),
)

const { node } = zodToTs(schemaZod, 'DDF')
const typeAlias = createTypeAlias(node, 'DDF')

const nodeString = printNode(typeAlias)

const schemaTS = `
export ${nodeString}

export declare function validate(data: unknown): DDF

${fs.readFileSync('./types.ts', { encoding: 'utf-8' })}

export {};
`

fs.writeFileSync(
    `${schemaDirectory}/ddf-validator.d.ts`,
    schemaTS,
)
