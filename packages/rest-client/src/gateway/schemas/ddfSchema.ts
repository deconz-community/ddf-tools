import { z } from 'zod'

export const ddfdDescriptorSchema = z.strictObject({
  uuid: z.string(),
  product: z.string(),
  version_deconz: z.string(),
  last_modified: z.string(),
  device_identifiers: z.array(
    z.tuple([z.string(), z.string()]),
  ),
}).passthrough()
