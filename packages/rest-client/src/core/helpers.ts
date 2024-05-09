import type { ZodType, ZodTypeAny } from 'zod'
import type { LazyTypes, MaybeLazy } from './types'

export interface ParameterDefinition<Format = any> {
  description: string
  type: 'path'
  schema: ZodType<Format>
  sample: Format
}

export interface EndpointResponseFormat {
  isOk: boolean
  type: 'json' | 'jsonArray' | 'blob'
  format: ZodTypeAny
}

export interface EndpointDefinition {
  description: string
  method: 'get' | 'post' | 'put' | 'delete'
  path: string
  responseFormats: Record<string, EndpointResponseFormat>
  parameters: Record<string, ParameterDefinition>
}

export function makeParameter<Output = any>(endpoint: ParameterDefinition<Output>): ParameterDefinition<Output> {
  return endpoint as ParameterDefinition<Output>
}

export function makeEndpoint<Endpoint extends EndpointDefinition>(endpoint: Endpoint): Endpoint {
  return endpoint
}

export function getValue<T extends LazyTypes>(value: MaybeLazy<T>): T {
  if (typeof value === 'function')
    return value()
  else
    return value
}
