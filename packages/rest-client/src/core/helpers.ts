import type { ZodType } from 'zod'
import type { LazyTypes, MaybeLazy } from './types'

export interface ParameterDefinition<Output = any> {
  name: string
  description: string
  type: 'path'
  schema: ZodType<Output>
  sample: Output
}

export interface EndpointDefinition<Alias extends string> {
  alias: Alias
  description: string
  method: 'get' | 'post' | 'put' | 'delete'
  path: string
  response: any
  parameters: ParameterDefinition[]
}

export function makeParameter<Output = any>(endpoint: ParameterDefinition<Output>): ParameterDefinition<Output> {
  return endpoint as ParameterDefinition<Output>
}

export function makeEndpoint<Alias extends string, Endpoint extends EndpointDefinition<Alias>>(endpoint: Endpoint) {
  return endpoint as Endpoint
}

export function getValue<T extends LazyTypes>(value: MaybeLazy<T>): T {
  if (typeof value === 'function')
    return value()
  else
    return value
}
