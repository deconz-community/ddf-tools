import { z } from 'zod'
import type { GenericsData } from '../types'
import { ddfRefines } from '../custom-refine/ddf-refine'
import { constantsSchema1, constantsSchema2 } from './constant'
import { ddfSchema } from './ddf'
import { resourceSchema } from './resource'
import { subDeviceSchema } from './sub-device'

export * from './constant'
export * from './ddf'
export * from './function'
export * from './resource'
export * from './sub-device'

export function mainSchema(generics: GenericsData) {
  return z.discriminatedUnion('schema', [
    ddfSchema(generics),
    constantsSchema1(generics),
    constantsSchema2(generics),
    resourceSchema(generics),
    subDeviceSchema(generics),
  ]).superRefine((data, ctx) => {
    // Splited in multiple to avoid typescript error
    switch (data.schema) {
      case 'devcap1.schema.json':
        ddfRefines[data.schema].map(v => v(data, ctx, generics))
        break
      case 'constants2.schema.json':
        ddfRefines[data.schema].map(v => v(data, ctx, generics))
        break
    }
  })
}
