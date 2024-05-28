import { z } from 'zod'

export const ddfdDescriptorSchema = z.strictObject({
  uuid: z.string(),
  product: z.string(),
  version_deconz: z.string(),
  last_modified: z.string().transform(value => new Date(value)),
  file_hash: z.string().optional()
    .describe('SHA256 hash of the file since version 2.27.1'),
  device_identifiers: z.array(
    z.tuple([z.string(), z.string()]),
  ),
}).passthrough()
