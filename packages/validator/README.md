# DDF validator

The complete solution for validating DDF File.

- [Installation](#installation)
- [Quick Start](#quick-start)

## Installation

```sh
npm install @deconz-community/ddf-validator
```

## Quick Start

You can validate all DDF in a specefic directory using the example below. The validate method will return the validated data or will throw a [Zod Error](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md). You can use the package `zod-validation-error` to format the error for the user.

Example :

```js
import { readFile } from 'node:fs/promises'
import glob from 'fast-glob'
import { fromZodError } from 'zod-validation-error'
import { validator } from '@deconz-community/ddf-validator'

(async () => {
  const validator = createValidator()

  const genericFiles = await glob('test-data/generic/**/*.json')
  const ddfFiles = await glob('test-data/**/*.json', {
    ignore: '**/generic/**',
  })

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
    try {
      const result = validator.loadGeneric(file.data)
      console.log(`Loaded generic file${file.path}`)
    }
    catch (error) {
      console.error(`Error while loading file ${file.path} : ${fromZodError(error).message}`)
    }
  })

  ddfFiles.forEach((filePath) => {
    const data = await readFile(filePath, 'utf-8')
    const decoded = JSON.parse(data)
    try {
      const result = validator.validate(decoded)
      console.log(`Validated file ${file.path}`)
    }
    catch (error) {
      console.error(`Error while validating file ${file.path} : ${fromZodError(error).message}`)
    }
  })
})()
```

## API

### createValidator()

Main function to validate the DDF data object.

#### Arguments
- `generics` - : GenericsData; Base generic data to validate DDF.

#### Return
Return a new validator instance.

#### Example

```typescript
import { createValidator } from '@deconz-community/ddf-validator'

const validator = createValidator({
  attributes: ['attr/id']
  manufacturers: { "$MF_FOO": "Foo inc." }
  deviceTypes: { "$TYPE_COLOR_LIGHT": "Color light" }
})

```


### validator.generics

Currently loaded generics.

#### Return
- `generics` - : GenericsData; Generic data to validate DDF.

### validator.loadGeneric()

Load generic data from an object.
Support files with schema `constants1.schema.json`, `constants2.schema.json`, `resourceitem1.schema.json` and `subdevice1.schema.json`.

#### Arguments
- `data` - : object; File data.

#### Return
- `data` - : object; File data.

Or throw [Zod Error](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md)

#### Example

```typescript
import { createValidator } from '@deconz-community/ddf-validator'

const validator = createValidator()
validator.loadGeneric({
  "schema": "constants1.schema.json",
  "manufacturers" : {
    "$MF_FOO": "Foo inc."
  },
  "device-types": {
    "$TYPE_COLOR_LIGHT": "Color light"
  }
})

```

### validator.validate()

Validate DDF data from an object.
Support files with schema `constants1.schema.json`, `constants2.schema.json`, `resourceitem1.schema.json`, `subdevice1.schema.json` and `devcap1.schema.json`.
Make sure to load any need generic first.

#### Arguments
- `data` - : object; File data.

#### Return
- `data` - : object; File data.

Or throw [Zod Error](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md)

#### Example

```typescript
import { createValidator } from '@deconz-community/ddf-validator'

const validator = createValidator()
validator.validate({
  "schema": "constants1.schema.json",
  "manufacturers" : {
    "$MF_FOO": "Foo inc."
  },
  "device-types": {
    "$TYPE_COLOR_LIGHT": "Color light"
  }
})

```

### validator.getSchema()

Return Zod schema with loaded generic data.

#### Return
- `schema` - : ZodType<DDF>; Zod Schema.

#### Example

```typescript
import { createValidator } from '@deconz-community/ddf-validator'
import { zodToJsonSchema } from 'zod-to-json-schema'

const validator = createValidator()
const schemaJson = zodToJsonSchema(validator.getSchema(), 'DDF')
```

### Type definition

### DDF

The type definition of a valid DDF file. Contain union type for `constants1.schema.json`, `resourceitem1.schema.json`, `subdevice1.schema.json` and `devcap1.schema.json`.

#### Example

```typescript
import type { DDF } from '@deconz-community/ddf-validator'

const data = {} as DDF
```
