import type { ZodType, ZodTypeAny } from 'zod'
import { z } from 'zod'

import type { Result, ResultOkType } from 'ts-results-es'
import type { endpoints } from '../gateway/endpoints'
import type { LazyTypes, MaybeLazy } from './types'
import type { CommonErrors, DeconzErrorCodes } from './errors'

// #region Utility types
export type ResolveZod<Input> = Input extends ZodType<any, any, any> ? z.infer<Input> : never

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

type Response<Alias extends EndpointAlias> = typeof endpoints[Alias]['response']
type Parameters<Alias extends EndpointAlias> = typeof endpoints[Alias]['parameters']

export type RequestResultForAlias<Alias extends EndpointAlias> = Result<
ExtractResponseSchemaForAlias<Alias>,
ExtractErrorsForAlias<Alias>
>[]

export type ExtractResponseSchemaForAlias<Alias extends EndpointAlias> =
  ResultOkType<ResolveZod<Response<Alias>['schema']>>

export type ExtractErrorsForAlias<Alias extends EndpointAlias> =
  ('deconzErrors' extends keyof Response<Alias>
  // @ts-expect-error Yes I know I cheated again
    ? CommonErrors<Response<Alias>['deconzErrors'][number]>
    : CommonErrors<never>)

// #region Params types
export type ExtractParamsNamesForAlias<Alias extends EndpointAlias> = keyof Parameters<Alias>

export type ExtractParamsForAlias<Alias extends EndpointAlias> =
Prettify<UndefinedToOptional<{
  [K in ExtractParamsNamesForAlias<Alias>]: ResolveZod<ExtractParamsSchemaForAlias<Alias, K>>
}>>

export type ExtractParamsSchemaForAlias<
  Alias extends EndpointAlias,
  ParamName extends ExtractParamsNamesForAlias<Alias>,
    // @ts-expect-error schema is defined
> = Parameters<Alias>[ParamName]['schema']

export const KNOWN_PARAMS = [
  'hidden',
  'apiKey',
  'alarmSystem/id',
  'group/id',
  'bundle/hash',
  'device/uuid',
] as const

export type KnownParam = typeof KNOWN_PARAMS[number]

export interface ParameterDefinition<Schema extends ZodTypeAny = ZodTypeAny> {
  description: string
  format?: 'json'
  type: 'path' | 'body'
  knownParam?: KnownParam
  schema: Schema
  sample: z.infer<Schema> | (() => z.infer<Schema>)
}
// #endregion

export interface EndpointDefinition {
  category: string
  subcategory?: string
  name: string
  description: string
  method: 'get' | 'post' | 'put' | 'delete'
  path: string
  baseURL?: string
  parameters: Record<string, ParameterDefinition>
  response: {
    format: 'json' | 'jsonArray' | 'blob'
    schema: ZodType<Result<any, any> | Result<any, any>[], any, any>
    deconzErrors?: DeconzErrorCodes[]
    removePrefix?: RegExp | string
  }
}

export function makeParameter<Schema extends ZodTypeAny>(endpoint: ParameterDefinition<Schema>): ParameterDefinition<Schema> {
  return endpoint
}

/*
export function makeParameter<Output = any>(endpoint: ParameterDefinition<Output>): ParameterDefinition<Output> {
  return endpoint as ParameterDefinition<Output>
}
*/

export function makeEndpoint<Endpoint extends EndpointDefinition>(endpoint: Endpoint): Endpoint {
  return endpoint
}

export function getValue<T extends LazyTypes>(value: MaybeLazy<T>): T {
  if (typeof value === 'function')
    return value()
  else
    return value
}

export function getStatusCode(data: unknown) {
  if (typeof data !== 'object' || data === null)
    return undefined

  return 'statusCode' in data ? data.statusCode : undefined
}

export function assertStatusCode(expectedCode: number | undefined) {
  return (data: unknown, ctx: z.RefinementCtx) => {
    if (expectedCode === undefined)
      return data

    const statusCode = getStatusCode(data)
    if (statusCode === expectedCode)
      return data

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Expected status code '${expectedCode}' but got '${statusCode}'`,
    })

    return data
  }
}
