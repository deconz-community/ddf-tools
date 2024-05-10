import axios from 'axios'
import type { Result } from 'ts-results-es'
import { Err, Ok } from 'ts-results-es'
import type { ZodError } from 'zod'
import type { EndpointAlias, EndpointDefinition, EndpointResponseFormat, ExtractFormatsSchemaForAlias, ExtractParamsForAlias, ExtractParamsNamesForAlias, ExtractParamsSchemaForAlias } from '../core/helpers'
import { getValue } from '../core/helpers'
import type { MaybeLazy } from '../core/types'

import { endpoints } from './endpoints'

const ERRORS = {
  NO_FORMAT: {
    code: 'NO_FORMAT',
    message: 'No format for that response',
  },
  PARSE_FAILED: {
    code: 'PARSE_FAILED',
    message: 'Failed to parse data',
  },
  NOT_IMPLEMENTED: {
    code: 'NOT_IMPLEMENTED',
    message: 'Format not implemented',
  },
} as const

function zodError(on: 'request' | 'response', error: ZodError) {
  if (on === 'request') {
    return {
      code: 'VALIDATION_ERROR_REQUEST',
      message: 'Invalid params provided',
      error,
    } as const
  }
  else {
    return {
      code: 'VALIDATION_ERROR_RESPONSE',
      message: 'Invalid response from the gateway',
      error,
    } as const
  }
}

export type CommonErrors = (typeof ERRORS)[keyof typeof ERRORS] | ReturnType<typeof zodError>

type RequestFunctionType = <
  Alias extends EndpointAlias,
  Params extends ExtractParamsForAlias<Alias>,
>(
  alias: Alias,
  params: Params
) => Promise<
  Result<
    ExtractFormatsSchemaForAlias<Alias, true>,
    CommonErrors | ExtractFormatsSchemaForAlias<Alias, false>
  >
>

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
  address: MaybeLazy<string>
  apiKey?: MaybeLazy<string | undefined>
}

export function gatewayClient(clientParams: ClientParams) {
  const {
    address,
    apiKey,
  } = clientParams

  const request: RequestFunctionType = async function (alias, params) {
    const endpoint = endpoints[alias] as EndpointDefinition

    const requestParams: Record<string, any> = structuredClone(params)

    if (endpoint.parameters.apiKey && requestParams.apiKey === undefined)
      requestParams.apiKey = apiKey

    let url = endpoint.path

    for (const [name, definition] of Object.entries(endpoint.parameters)) {
      const value = getValue(requestParams[name as keyof typeof requestParams])

      const parsed = endpoint.parameters[name as keyof typeof endpoint.parameters].schema.safeParse(value)

      if (!parsed.success)
        return Err(zodError('request', parsed.error))

      switch (definition.type) {
        case 'path':
          url = url.replace(`{:${name}:}`, value)

          break
      }
    }
    const { data, status } = await axios.request({
      method: endpoint.method,
      baseURL: getValue(address),
      url,
      timeout: 5000,
      validateStatus: () => true,
      responseType: 'arraybuffer',
      headers: {
        Accept: 'application/vnd.ddel.v1.1', // Version recommended by Manup
      },
    })

    const statusKey = `status_${status}`
    if (!(statusKey in endpoint.responseFormats))
      return Err(ERRORS.NO_FORMAT)

    const { format, isOk, type } = endpoint.responseFormats[statusKey]

    try {
      switch (type) {
        case 'json': {
          const decoder = new TextDecoder('utf-8')
          const textData = decoder.decode(data)
          const jsonData = JSON.parse(textData)
          const returnData = format.safeParse(jsonData)
          if (!returnData.success)
            return Err(zodError('request', returnData.error))

          if (isOk)
            return Ok(returnData.data) as any
          else
            return Err(returnData.data) as any
        }

        case 'jsonArray': {
          console.log('coucou')
          const decoder = new TextDecoder('utf-8')
          const textData = decoder.decode(data)
          const jsonData = JSON.parse(textData)

          /*
          z.string()
          .transform((val) => val.length)
          .pipe(z.number().min(5))
          */

          return Err(ERRORS.NOT_IMPLEMENTED)
        }

        default:
          return Err(ERRORS.NOT_IMPLEMENTED)
      }
    }
    catch (error) {
      console.error(error)
      return Err(ERRORS.PARSE_FAILED)
    }

    return Err(ERRORS.NOT_IMPLEMENTED)
  }

  return { request }
}

export function getParamZodSchema<
  Alias extends EndpointAlias,
  ParamName extends ExtractParamsNamesForAlias<Alias>,
>(
  alias: Alias,
  paramName: ParamName,
) {
  const { parameters } = endpoints[alias]
  const parameter = parameters[paramName as keyof (typeof parameters)]
  return parameter.schema as ExtractParamsSchemaForAlias<Alias, ParamName>
}

/*
export function getParamZodSchema(alias: string, type: 'body', name: string): ZodObject<any> | undefined {
  return [
    ...configEndpoints,
    ...ddfEndpoints,
    ...alarmSystemsEndpoints,
    ...devicesEndpoints,
    ...sensorsEndpoints,
    ...groupsEndpoints,
    ...lightsEndpoints,
  ].find(endpoint => endpoint.alias === alias)?.parameters?.find(p => p.name === type)?.schema?.shape[name]
}
*/

/*
export type GatewayClient = ReturnType<typeof gatewayClient>
export type GatewayApi = ApiOf<GatewayClient>

export type DDFDescriptor = z.infer<typeof ddfdDescriptorSchema>

export type GatewayBodyParams<Alias extends string> = ZodiosBodyByAlias<GatewayApi, Alias>
export type GatewayHeaderParams<Alias extends string> = ZodiosHeaderParamsByAlias<GatewayApi, Alias>
export type GatewayPathParam<Alias extends string> = ZodiosPathParamByAlias<GatewayApi, Alias>
export type GatewayResponse<Alias extends string> = ZodiosResponseByAlias<GatewayApi, Alias>
export type GatewayQueryParams<Alias extends string> = ZodiosQueryParamsByAlias<GatewayApi, Alias>

*/

/*
interface GatewayInfo {
  gateway: GatewayClient
  uri: string
  apiKey: string
  bridgeID: string
}

export type FindGatewayResult = Result<
  (
    {
      code: 'ok'
      config: Extract<GatewayResponse<'getConfig'>['success'], { whitelist: any }>
    } |
    {
      code: 'bridge_id_mismatch' | 'invalid_api_key'
      message: string
    }
  ) & GatewayInfo,
  {
    code: 'unreachable' | 'unknown'
    message?: string
  } & Partial<Pick<GatewayInfo, 'uri' | 'apiKey'>>
>
*/
