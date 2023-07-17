import { z } from 'zod'
import { ddfRefines } from '../custom-refine/ddf-refine'
import type { GenericsData } from '../types'

import * as s from './'

export * from './constant'
export * from './ddf'
export * from './function'
export * from './resource'
export * from './sub-device'

export function mainSchema(generics: GenericsData) {
  return z.discriminatedUnion('schema', [
    s.ddfSchema(generics),
    s.constantsSchema1(generics),
    s.constantsSchema2(generics),
    s.resourceSchema(generics),
    s.subDeviceSchema(generics),
  ]).superRefine((data, ctx) => {
    // Splited in multiple to avoid typescript error
    switch (data.schema) {
      case 'devcap1.schema.json':
        ddfRefines[data.schema].map(v => v(data, ctx))
        break
      case 'constants2.schema.json':
        ddfRefines[data.schema].map(v => v(data, ctx))
        break
    }
  })
}
