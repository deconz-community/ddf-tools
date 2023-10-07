import type { z } from 'zod'
import type { resourceSchema, subDeviceSchema } from './schema'

export interface GenericsData {
  attributes: string[]
  resources: Record<string, Omit<z.infer<ReturnType<typeof resourceSchema>>, 'schema' | 'id'>>
  manufacturers: Record<string, string>
  deviceTypes: Record<string, string>
  subDevices: Record<string, z.infer<ReturnType<typeof subDeviceSchema>>>
}

export interface FileDefinition {
  path: string
  data: unknown
}

export type FileDefinitionWithError = FileDefinition & {
  error: z.ZodError | Error
}
