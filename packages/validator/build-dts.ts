#!/usr/bin/env ts-node

import fs from 'fs'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts'
import glob from 'glob'

import { createValidator } from './src/validator'

// Generate zod Schema
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

// Prepare output dir
const outputDirectory = './dist'
if (!fs.existsSync(outputDirectory))
  fs.mkdirSync(outputDirectory, { recursive: true })

// Write json schema
const schemaJson = zodToJsonSchema(schemaZod, 'DDF')
fs.writeFileSync(
    `${outputDirectory}/ddf-schema.json`,
    JSON.stringify(schemaJson),
)

// Write typescript schema
const { node } = zodToTs(schemaZod, 'DDF')
const typeAlias = createTypeAlias(node, 'DDF')

const nodeString = printNode(typeAlias)

const schemaTS = `import { ZodType } from "zod";

export ${nodeString}

export interface GenericsData {
  attributes: string[]
  resources: Record<string, Omit<Extract<DDF, { schema: "resourceitem1.schema.json" }>, 'schema' | 'id'>>
  manufacturers: Record<string, string>
  deviceTypes: Record<string, string>
}

export declare function createValidator(generics?: GenericsData): {
  generics: GenericsData;
  loadGeneric: (data: unknown) => DDF;
  validate: (data: unknown) => DDF;
  getSchema: () => ZodType<DDF>;
};

export {};
`

fs.writeFileSync(
    `${outputDirectory}/ddf-validator.d.ts`,
    schemaTS,
)
