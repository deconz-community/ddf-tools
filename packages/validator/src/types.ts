import type { z } from 'zod'
import type { resourceSchema } from './schema'

export interface GenericsData {
  attributes: string[]
  resources: Record<string, Omit<z.infer<ReturnType<typeof resourceSchema>>, 'schema' | 'id'>>
  manufacturers: Record<string, string>
  deviceTypes: Record<string, string>
}
