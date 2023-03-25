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
    s.constantsSchema(generics),
    s.resourceSchema(generics),
    s.subDeviceSchema(generics),
  ]).superRefine((data, ctx) => {
    switch (data.schema) {
      case 'devcap1.schema.json':
        ddfRefines.map(v => v(data, ctx))
        break
    }
  })
}
