import axios from 'axios'
import type { Result } from 'ts-results-es'
import { Err } from 'ts-results-es'
import { z } from 'zod'
import type { EndpointAlias, EndpointDefinition, ExtractParamsForAlias, ExtractParamsNamesForAlias, ExtractParamsSchemaForAlias, RequestResultForAlias } from '../core/helpers'
import { getValue } from '../core/helpers'
import type { MaybeLazy } from '../core/types'

import type { CommonErrors } from '../core/errors'
import { clientError, deconzError, httpError, zodError } from '../core/errors'
import { endpoints } from './endpoints'

type RequestFunctionType = <
  Alias extends EndpointAlias,
  Params extends ExtractParamsForAlias<Alias>,
>(
  alias: Alias,
  params: Params
) => Promise<RequestResultForAlias<Alias>>

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
    const queryParams: Record<string, any> = {}
    const baseURL = endpoint.baseURL ?? getValue(address)

    if (baseURL === undefined)
      return [Err(clientError('NO_URL'))]

    let requestData: any
    const headers: Record<string, string> = {
      Accept: 'application/vnd.ddel.v1.1', // Version recommended by Manup
    }

    // #region Handle parameters
    if (endpoint.parameters) {
      if (endpoint.parameters.apiKey && requestParams.apiKey === undefined)
        requestParams.apiKey = apiKey

      for (const [name, definition] of Object.entries(endpoint.parameters)) {
        const value = getValue(requestParams[name as keyof typeof requestParams])

        switch (definition.type) {
          case 'path':
            url = url.replace(`/:${name}`, `/${value}`)
            break

          case 'body':
            switch (definition.format) {
              case undefined:
              case 'json':{
                // Let axios handle the serialization
                const parsed = await endpoint.parameters[name as keyof typeof endpoint.parameters].schema.safeParseAsync(value)

                if (!parsed.success)
                  return [Err(zodError('request', parsed.error))]

                requestData = parsed.data
                break
              }

              case 'blob':{
                const parsed = await endpoint.parameters[name as keyof typeof endpoint.parameters].schema.safeParseAsync(value)

                if (!parsed.success)
                  return [Err(zodError('request', parsed.error))]

                const formData = new FormData()
                const values = (Array.isArray(parsed.data) ? parsed.data : [parsed.data]) as File[]
                values.forEach((file) => {
                  if (file)
                    formData.append('file', file)
                })
                requestData = formData
                break
              }

              default:
                console.warn(`No parser for format of type body/${definition.format}`)
                return [Err(clientError('PARAMS_PARSE_FAILED'))]
            }

            break

          case 'header':{
            const parsed = await endpoint.parameters[name as keyof typeof endpoint.parameters].schema.safeParseAsync(value)

            if (!parsed.success)
              return [Err(zodError('request', parsed.error))]

            headers[definition.key] = parsed.data
            break
          }

          case 'query':{
            const parsed = await endpoint.parameters[name as keyof typeof endpoint.parameters].schema.safeParseAsync(value)

            if (!parsed.success)
              return [Err(zodError('request', parsed.error))]

            queryParams[definition.key] = parsed.data
            break
          }

          default:
            console.warn(`No parser for param of type ${definition.type}`)
            return [Err(clientError('PARAMS_PARSE_FAILED'))]
        }
      }
    }

    // #endregion

    const { data: responseData, status, statusText } = await axios.request({
      method: endpoint.method,
      baseURL,
      url,
      params: queryParams,
      data: requestData,
      timeout,
      validateStatus: () => true,
      responseType: 'arraybuffer',
      headers,
    })

    const { deconzErrors, schema, removePrefix } = endpoint.response
    let { format } = endpoint.response

    function packResponse<Data extends any[]>(value: Data): Data {
      Object.defineProperty(value, 'statusCode', {
        value: status,
        writable: false,
        enumerable: false,
      })

      switch (format) {
        case 'json':
        case 'jsonArray':{
          let lastValue: any = responseData

          try {
            const decoder = new TextDecoder('utf-8')
            lastValue = decoder.decode(responseData)
            lastValue = JSON.parse(lastValue)
          }
          catch (e) { }

          Object.defineProperty(value, 'rawResponse', {
            value: lastValue,
            writable: false,
            enumerable: false,
          })

          break
        }

        case 'blob':{
          Object.defineProperty(value, 'rawResponse', {
            value: {
              type: 'blob',
              length: responseData.byteLength,
              data: responseData,
            },
            writable: false,
            enumerable: false,
          })
          break
        }
        default:
      }

      return value
    }

    function getString(string: string) {
      if (removePrefix === undefined)
        return string
      return string.replace(removePrefix, '')
    }

    if (status !== 200 && format === 'json')
      format = 'jsonArray'

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

          const returnData = await schema.safeParseAsync(jsonData)
          if (returnData.success) {
            if (Array.isArray(returnData.data))
              return packResponse(returnData.data)
            else
              return packResponse([returnData.data])
          }

          return packResponse([Err(zodError('response', returnData.error))])
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

          const rawData = await z.array(z.object({
            success: z.any().optional(),
            error: z.object({
              address: z.string(),
              description: z.string(),
              type: z.number(),
            }).optional(),
          })).safeParseAsync(jsonData)

          if (!rawData.success)
            return packResponse([Err(zodError('response', rawData.error))])

          const result: {
            success?: any
            errors?: CommonErrors<any>[]
          } = {}

          for (const item of rawData.data) {
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
                const error = await z.object({
                  address: z.string(),
                  description: z.string(),
                  type: z.number(),
                }).safeParseAsync(item.error)

                if (error.success) {
                  if (deconzErrors && error.data.type && !deconzErrors.includes(error.data.type as any))
                    console.warn(`Unexpected error for alias=${alias}, type=${error.data.type} `)
                  result.errors.push(deconzError(
                    error.data.type,
                    getString(error.data.address),
                  ))
                }
                else {
                  result.errors.push(clientError('RESPONSE_PARSE_FAILED'))
                }
              }
            }
          }

          const returnResults: Result<any, any>[] = []

          if (typeof result.success === 'object' && result.success !== null) {
            Object.defineProperty(result.success, 'statusCode', {
              value: status,
              writable: false,
              enumerable: false,
            })
          }

          if (result.success) {
            const successData = await schema.safeParseAsync(result.success)

            if (!successData.success)
              return packResponse([Err(zodError('response', successData.error))])

            if (Array.isArray(successData.data))
              returnResults.push(...successData.data)
            else
              returnResults.push(successData.data)
          }

          result.errors?.forEach((error) => {
            returnResults.push(Err(error))
          })

          return packResponse(returnResults)
        }

        case 'blob': {
          const returnData = await schema.safeParseAsync(responseData)
          if (returnData.success) {
            if (Array.isArray(returnData.data))
              return packResponse(returnData.data)
            else
              return packResponse([returnData.data])
          }

          return packResponse([Err(zodError('response', returnData.error))])
        }

        case 'blank': {
          const returnData = await schema.safeParseAsync('')
          if (returnData.success) {
            if (Array.isArray(returnData.data))
              return packResponse(returnData.data)
            else
              return packResponse([returnData.data])
          }

          return packResponse([Err(zodError('response', returnData.error))])
        }

        default:
          return packResponse([Err(clientError('NOT_IMPLEMENTED'))])
      }
    }
    catch (error) {
      if (status === 200) {
        console.error(error)
        return packResponse([Err(clientError('RESPONSE_PARSE_FAILED'))])
      }
      else {
        return packResponse([Err(httpError(status, statusText))])
      }
    }

    return packResponse([Err(clientError('NOT_IMPLEMENTED'))])
  } as RequestFunctionType

  return {
    request,
    address,
    apiKey,
  }
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
