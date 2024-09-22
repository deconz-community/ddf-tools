import { z } from 'zod'

export const ddfdDescriptorSchema = z.strictObject({
  uuid: z.string().describe('UUID of the source DDF. It\'s used to find other version of the DDF on the bundle store.'),
  product: z.string().describe('Product name of the device.'),
  version_deconz: z.string().describe('Minimum version of the deCONZ REST API.'),
  last_modified: z.string().transform(value => new Date(value)).describe('Last modified date of the DDF source.'),
  file_hash: z.string().optional().describe('SHA256 hash of the file since version 2.27.1'),
  device_identifiers: z.array(
    z.tuple([z.string(), z.string()]),
  ).describe('List of device identifiers that are supported by the DDF bundle.'),
}).passthrough()
