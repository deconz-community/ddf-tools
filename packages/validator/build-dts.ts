#!/usr/bin/env ts-node

import fs from 'fs'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts'
import { mainSchema } from './src/schema'

const schemaDirectory = './dist'
const schemaZod = mainSchema()

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

export {};
`

fs.writeFileSync(
    `${schemaDirectory}/ddf-validator.d.ts`,
    schemaTS,
)
