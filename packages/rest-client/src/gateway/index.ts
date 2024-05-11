import axios from 'axios'
import type { Result } from 'ts-results-es'
import { Err } from 'ts-results-es'
import { z } from 'zod'
import type { EndpointAlias, EndpointDefinition, ExtractParamsForAlias, ExtractParamsNamesForAlias, ExtractParamsSchemaForAlias, RequestResultForAlias } from '../core/helpers'
import { getValue } from '../core/helpers'
import type { MaybeLazy } from '../core/types'

import type { CommonErrors } from '../core/errors'
import { clientError, deconzError, zodError } from '../core/errors'
import { endpoints } from './endpoints'

type RequestFunctionType = <
  Alias extends EndpointAlias,
  Params extends ExtractParamsForAlias<Alias>,
>(
  alias: Alias,
  params: Params
) => Promise<RequestResultForAlias<Alias>>

/*
type IsEmptyObject<T> = keyof T extends never ? true : false

type RequestFunctionType = <
  Alias extends EndpointAlias,
  Params extends ExtractParamsForAlias<Alias>,
>(
  alias: Alias,
  ...params: IsEmptyObject<Params> extends true ? [] : [Params]
) => Promise<
  Result<
    ExtractFormatsSchemaForAlias<Alias, true>,
    ErrorMessages | ExtractFormatsSchemaForAlias<Alias, false>
  >
>
*/

export interface ClientParams {
  address?: MaybeLazy<string | undefined>
  apiKey?: MaybeLazy<string | undefined>
  timeout?: number
}

export type GatewayClient = ReturnType<typeof gatewayClient>

export function gatewayClient(clientParams: ClientParams = {}) {
  const {
    address,
    apiKey,
    timeout = 5000,
  } = clientParams

  const request: RequestFunctionType = async function (alias, params) {
    const endpoint = endpoints[alias] as EndpointDefinition

    const requestParams: Record<string, any> = structuredClone(params)

    let url = endpoint.path
    const baseURL = endpoint.baseURL ?? getValue(address)

    if (baseURL === undefined)
      return [Err(clientError('NO_URL'))]

    let requestData: any

    // #region Handle parameters
    if (endpoint.parameters) {
      if (endpoint.parameters.apiKey && requestParams.apiKey === undefined)
        requestParams.apiKey = apiKey

      for (const [name, definition] of Object.entries(endpoint.parameters)) {
        const value = getValue(requestParams[name as keyof typeof requestParams])

        const parsed = endpoint.parameters[name as keyof typeof endpoint.parameters].schema.safeParse(value)

        if (!parsed.success)
          return [Err(zodError('request', parsed.error))]

        switch (definition.type) {
          case 'path':
            url = url.replace(`{:${name}:}`, value)
            break

          case 'body':
            switch (definition.format) {
              case undefined:
              case 'json':
                // Let axios handle the serialization
                requestData = value
                break

              default:
                console.warn(`No parser for format of type body/${definition.format}`)
                return [Err(clientError('PARAMS_PARSE_FAILED'))]
            }

            break

          default:
            console.warn(`No parser for param of type ${definition.type}`)
            return [Err(clientError('PARAMS_PARSE_FAILED'))]
        }
      }
    }
    // #endregion

    const { data: responseData, status } = await axios.request({
      method: endpoint.method,
      baseURL,
      url,
      data: requestData,
      timeout,
      validateStatus: () => true,
      responseType: 'arraybuffer',
      headers: {
        Accept: 'application/vnd.ddel.v1.1', // Version recommended by Manup
      },
    })

    const { format, deconzErrors, schema, removePrefix } = endpoint.response

    function getString(string: string) {
      if (removePrefix === undefined)
        return string
      return string.replace(removePrefix, '')
    }

    try {
      switch (format) {
        case 'json': {
          const decoder = new TextDecoder('utf-8')
          const textData = decoder.decode(responseData)
          const jsonData = JSON.parse(textData)

          Object.defineProperty(jsonData, 'statusCode', {
            value: status,
            writable: false,
            enumerable: false,
          })

          const returnData = schema.safeParse(jsonData)
          if (returnData.success) {
            if (Array.isArray(returnData.data))
              return returnData.data
            else
              return [returnData.data]
          }

          return [Err(zodError('response', returnData.error))]
        }

        case 'jsonArray': {
          const decoder = new TextDecoder('utf-8')
          const textData = decoder.decode(responseData)
          const jsonData = JSON.parse(textData)

          Object.defineProperty(jsonData, 'statusCode', {
            value: status,
            writable: false,
            enumerable: false,
          })

          const rawData = z.array(z.object({
            success: z.any().optional(),
            error: z.object({
              address: z.string(),
              description: z.string(),
              type: z.number(),
            }).optional(),
          })).safeParse(jsonData)

          if (!rawData.success)
            return [Err(zodError('response', rawData.error))]

          const result: {
            success?: any
            errors?: CommonErrors<any>[]
          } = {}

          rawData.data.forEach((item) => {
            if ('success' in item) {
              if (Array.isArray(item.success)) {
                result.success = item.success
                return
              }

              if (result.success === undefined)
                result.success = {}

              if (typeof item.success === 'string') {
                result.success.value = getString(item.success)
              }
              else if (item.success === null) {
                // Because null is an object
                result.success.value = null
              }
              else if (item.success instanceof Blob) {
                // Because a Blob is an object
                result.success.value = item.success
              }
              else if (typeof item.success === 'object') {
                // Loop for probably only one item
                for (const [key, value] of Object.entries(item.success ?? {}))
                  result.success[getString(key)] = value
              }
              else {
                result.success.value = item.success
              }
            }
            if ('error' in item) {
              if (result.errors === undefined)
                result.errors = []
              if (typeof item.error === 'string') {
                throw new TypeError('Not Implemented')
              }
              else if (typeof item.error === 'object') {
                const error = z.object({
                  address: z.string(),
                  description: z.string(),
                  type: z.number(),
                }).safeParse(item.error)

                if (deconzErrors && error.data?.type && !deconzErrors.includes(error.data.type as any))
                  console.warn('Unexpected error ', error.data.type)

                if (error.success)
                  result.errors.push(deconzError(error.data.type))
                else
                  result.errors.push(clientError('RESPONSE_PARSE_FAILED'))
              }
            }
          })

          const results: Result<any, any>[] = []

          if (typeof result.success === 'object' && result.success !== null) {
            Object.defineProperty(result.success, 'statusCode', {
              value: status,
              writable: false,
              enumerable: false,
            })
          }

          const successData = schema.safeParse(result.success)

          if (!successData.success)
            return [Err(zodError('response', successData.error))]

          if (Array.isArray(successData.data))
            results.push(...successData.data)
          else
            results.push(successData.data)

          result.errors?.forEach((error) => {
            results.push(Err(error))
          })

          return results
        }

        default:
          return [Err(clientError('NOT_IMPLEMENTED'))]
      }
    }
    catch (error) {
      console.error(error)
      return [Err(clientError('RESPONSE_PARSE_FAILED'))]
    }

    return [Err(clientError('NOT_IMPLEMENTED'))]
  } as RequestFunctionType

  return { request }
}

export function getParamZodSchema<
  Alias extends EndpointAlias,
  ParamName extends ExtractParamsNamesForAlias<Alias>,
>(
  alias: Alias,
  paramName: ParamName,
) {
  const { parameters } = endpoints[alias] as EndpointDefinition
  const parameter = parameters[paramName as keyof (typeof parameters)]
  return parameter.schema as ExtractParamsSchemaForAlias<Alias, ParamName>
}
