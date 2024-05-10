import type { ZodType, ZodTypeAny, z } from 'zod'
import type { endpoints } from '../gateway/endpoints'
import type { LazyTypes, MaybeLazy } from './types'

// #region Utility types
export type ResolveZod<Input> = Input extends ZodTypeAny ? z.infer<Input> : never

// https://www.youtube.com/watch?v=2lCCKiWGlC0
export type Prettify<T> = {
  [K in keyof T]: T[K];
// eslint-disable-next-line ts/ban-types
} & {}

// https://jobs.ataccama.com/blog/how-to-convert-object-props-with-undefined-type-to-optional-properties-in-typescript
export type GetMandatoryKeys<T> = {
  [P in keyof T]: T[P] extends Exclude<T[P], undefined> ? P : never
}[keyof T]

export type UndefinedToOptional<T> = Partial<T> & Pick<T, GetMandatoryKeys<T>>

// #endregion

export type EndpointAlias = keyof typeof endpoints

type ResponseFormats<Alias extends EndpointAlias> = typeof endpoints[Alias]['responseFormats']
type Parameters<Alias extends EndpointAlias> = typeof endpoints[Alias]['parameters']

type ExtractFormatsKeys<Alias extends EndpointAlias, Ok extends true | false> = {
  // @ts-expect-error isOk is defined
  [K in keyof ResponseFormats<Alias>]: ResponseFormats<Alias>[K]['isOk'] extends Ok ? K : never;
}[keyof ResponseFormats<Alias>]

export type ExtractFormatsSchemaForAlias<Alias extends EndpointAlias, Ok extends true | false> =
  // @ts-expect-error format is defined
  ResolveZod<ResponseFormats<Alias>[ExtractFormatsKeys<Alias, Ok>]['format']>

export type ExtractParamsNamesForAlias<Alias extends EndpointAlias> = keyof Parameters<Alias>

export type ExtractParamsForAlias<Alias extends EndpointAlias> =
Prettify<UndefinedToOptional<{
  // @ts-expect-error schema is defined
  [K in ExtractParamsNamesForAlias<Alias>]: ResolveZod<Parameters<Alias>[K]['schema']>
}>>

export interface ParameterDefinition<Format = any> {
  description: string
  type: 'path'
  config?: 'apiKey'
  schema: ZodType<Format>
  sample: Format
}

export type EndpointResponseFormat = {
  isOk: true
  type: 'json' | 'jsonArray' | 'blob'
  format: ZodTypeAny
} | {
  isOk: false
  type: 'json' | 'jsonArray' | 'blob'
  format: ZodType<{
    code: string
    message: string
  } & Record<string, any>>
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
