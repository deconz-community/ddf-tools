import { z } from 'zod'
import type { ddfSchema } from '../schema'

export const ddfRefines = [
  validateManufacturerNameAndModelID,
] as const

type DDF = z.infer<ReturnType<typeof ddfSchema>>

function validateManufacturerNameAndModelID(data: DDF, ctx: z.RefinementCtx) {
  const areBothString = typeof data.manufacturername === 'string'
      && typeof data.modelid === 'string'

  if (areBothString)
    return

  const areBothArray = Array.isArray(data.manufacturername)
      && Array.isArray(data.modelid)

  if (areBothArray && data.manufacturername.length !== data.modelid.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_intersection_types,
      message: 'When \'manufacturername\' and \'modelid\' are both arrays they should be the same length.',
      path: ['manufacturername', 'modelid'],
    })
    return
  }

  if ((areBothString || areBothArray) === false) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_intersection_types,
      message: 'Invalid properties \'manufacturername\' and \'modelid\' should have the same type.',
      path: ['manufacturername', 'modelid'],
    })
  }
}
