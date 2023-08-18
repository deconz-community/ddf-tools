import { z } from 'zod'

export const errorSchema = z.array(
  z.strictObject({
    address: z.string(),
    description: z.string(),
    type: z.number(),
    code: z.string(),
  }),
)
