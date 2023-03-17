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
import { readFile } from 'fs/promises'
import glob from 'glob'
import { fromZodError } from 'zod-validation-error'
import { validate } from '@deconz-community/ddf-validator'

(async () => {
  const jsonfiles = await glob('devices/**/*.json', { ignore: '**/generic/**' })
  jsonfiles.forEach((filePath) => {
    const data = await readFile(filePath, 'utf-8')
    const decoded = JSON.parse(data)
    try {
      const result = validate(decoded)
      console.log(result)
    }
    catch (error) {
      throw new Error(fromZodError(error).message)
    }
  })
})()
```

## API

### validate

Main function to validate the DDF data object.

#### Arguments
- `data` - object; The DDF data parsed from JSON (required)

#### Example

```typescript
import { validate } from '@deconz-community/ddf-validator'
import { fromZodError } from 'zod-validation-error'

const decoded = JSON.parse("{...}")

try {
    const result = validate(decoded)
    console.log(result) // DDF type
}
catch (error) {
    throw new Error(fromZodError(error).message)
}
```

### Type definition

### DDF

The type definition of a valid DDF file.

#### Example

```typescript
import type { DDF } from '@deconz-community/ddf-validator'

const data = {} as DDF
```
