import { z } from 'zod'

import { errorSchema } from './schemas/errorSchema'

interface PrepareResponseOptions {
  removePrefix?: RegExp
}

export function prepareResponse<TS extends z.ZodTypeAny>(successSchema: TS, options: PrepareResponseOptions = {}) {
  function getString(string: string) {
    if (options.removePrefix === undefined)
      return string
    return string.replace(options.removePrefix, '')
  }

  const errorsMap: Record<number, string> = {
    1: 'UNAUTHORIZED_USER',
    2: 'INVALID_JSON',
    3: 'RESOURCE_NOT_AVAILABLE',
    4: 'METHOD_NOT_AVAILABLE',
    5: 'MISSING_PARAMETER',
    6: 'PARAMETER_NOT_AVAILABLE',
    7: 'INVALID_VALUE',
    8: 'PARAMETER_NOT_MODIFIABLE',
    11: 'TOO_MANY_ITEMS',
    100: 'DUPLICATE_EXIST',
    501: 'NOT_ALLOWED_SENSOR_TYPE',
    502: 'SENSOR_LIST_FULL',
    601: 'RULE_ENGINE_FULL',
    607: 'CONDITION_ERROR',
    608: 'ACTION_ERROR',
    901: 'INTERNAL_ERROR',

    950: 'NOT_CONNECTED',
    951: 'BRIDGE_BUSY',

    101: 'LINK_BUTTON_NOT_PRESSED',
    201: 'DEVICE_OFF',
    202: 'DEVICE_NOT_REACHABLE',
    301: 'BRIDGE_GROUP_TABLE_FULL',
    302: 'DEVICE_GROUP_TABLE_FULL',
    402: 'DEVICE_SCENES_TABLE_FULL',
  }

  return z.preprocess(
    (data: unknown) => {
      // console.log('data', data)

      const result: {
        success?: any
        errors?: {
          address: string
          description: string
          type: number
          code: string
        }[]
      } = {}

      const rawData = z.array(z.object({
        success: z.any().optional(),
        error: z.object({
          address: z.string(),
          description: z.string(),
          type: z.number(),
        }).optional(),
      })).parse(data)

      Object.defineProperty(result, 'rawData', {
        value: data,
        writable: false,
      })

      // console.log('rawData', rawData)

      rawData.forEach((item) => {
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
            }).parse(item.error)

            result.errors.push({
              ...error,
              address: getString(error.address),
              code: errorsMap[error.type] ?? 'UNKNOWN_ERROR',
            })
          }
        }
      })

      // Différents formats de résultats:
      // 'patch' ->  [ { "success": { "reload": "60:a4:23:ff:ba:f0:47:22" } } ]
      // 'data'  ->  [ 'foo', 'bar' ]
      // 'data'  ->  { "reload": "60:a4:23:ff:ba:f0:47:22" }

      // Unwrap success value if only one
      if (result.success !== undefined) {
        const successKeys = Object.keys(result.success)
        if (successKeys.length === 1 && successKeys[0] === 'value') {
          // console.log('unwrap value')
          result.success = result.success.value
        }
      }

      // console.log('result', result)

      return result
    },
    z.strictObject({
      success: successSchema.optional(),
      errors: errorSchema.optional(),
    }),
  )
}
