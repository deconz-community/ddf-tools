#!/usr/bin/env ts-node

import fs from 'node:fs'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts'
import fastGlob from 'fast-glob'
import { createValidator } from './dist/ddf-validator.cjs'

const { globSync } = fastGlob

// Generate zod Schema
const validator = createValidator()
const genericFiles = globSync('test-data/generic/**/*.json')

const genericFilesData = genericFiles.map((filePath) => {
  const data = fs.readFileSync(filePath, { encoding: 'utf-8' })
  const decoded = JSON.parse(data)
  return { path: filePath, data: decoded }
})

genericFilesData.sort((a, b) => {
  if (a.data.schema !== b.data.schema)
    return a.data.schema.localeCompare(b.data.schema)

  // Reverse the order to load state/airqualityppb before state/airquality
  return b.path.localeCompare(a.path)
})

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

const schemaTS = `import { ZodType, ZodError } from "zod";

export ${nodeString}

export interface GenericsData {
  attributes: string[]
  resources: Record<string, Omit<Extract<DDF, { schema: "resourceitem1.schema.json" }>, 'schema' | 'id'>>
  manufacturers: Record<string, string>
  deviceTypes: Record<string, string>
}

export interface FileDefinition {
  path: string
  data: unknown
}

export type FileDefinitionWithError = FileDefinition & {
  error: ZodError | Error
}

export declare function createValidator(generics?: GenericsData): {
  generics: GenericsData;
  loadGeneric: (data: unknown) => DDF;
  validate: (data: unknown) => DDF;
  getSchema: () => ZodType<DDF>;
  bulkValidate: (genericFiles: FileDefinition[], ddfFiles: FileDefinition[], callbacks?: {
    onSectionStart?: ((type: 'generic' | 'ddf', total: number) => void) | undefined;
    onSectionProgress?: ((type: 'generic' | 'ddf', current: number, total: number) => void) | undefined;
    onSectionEnd?: ((type: 'generic' | 'ddf', total: number, errors: FileDefinitionWithError[]) => void) | undefined;
}) => FileDefinitionWithError[]
  version: string;
};

export {};
`

fs.writeFileSync(
    `${outputDirectory}/ddf-validator.d.ts`,
    schemaTS,
)
