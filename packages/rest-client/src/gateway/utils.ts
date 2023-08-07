import { z } from 'zod'

import { errorSchema } from './schemas/errorSchema'

interface PrepareResponseOptions {
  removePrefix?: RegExp
}

export function prepareResponse<TS extends z.ZodTypeAny>(successSchema: TS, options: PrepareResponseOptions = {}) {
  return z.preprocess(
    (data: unknown) => {
      const unwrappedCompleteData: {
        success: Record<string, unknown>
        errors: {
          address: string
          description: string
          type: number
        }[]
      } = {
        success: {},
        errors: [],
      }

      const dataArray: unknown[] = Array.isArray(data)
        ? data
        : [{ success: data }]

      // Loop for each data and unwrap it
      dataArray.forEach((item) => {
        if (typeof item !== 'object' || item === null)
          throw new Error('Invalid data recieved')

        // Handle success
        if ('success' in item) {
          if (typeof item.success === 'string') {
            unwrappedCompleteData.success.value = options.removePrefix !== undefined
              ? item.success.replace(options.removePrefix, '')
              : item.success
          }
          else if (typeof item.success === 'object') {
          // Loop for probably only one item
            for (const [key, value] of Object.entries(item.success ?? {})) {
              unwrappedCompleteData.success[
                options.removePrefix !== undefined
                  ? key.replace(options.removePrefix, '')
                  : key
              ] = value
            }
          }
        }
        else if ('error' in item) {
          if (typeof item.error === 'string') {
            throw new TypeError('Not Implemented')
          }
          else if (typeof item.error === 'object') {
            const error = z.object({
              address: z.string(),
              description: z.string(),
              type: z.number(),
            }).parse(item.error)

            unwrappedCompleteData.errors.push({
              address: options.removePrefix !== undefined
                ? error.address.replace(options.removePrefix, '')
                : error.address,
              description: error.description,
              type: error.type,
            })
          }
        }
      })

      // Remove empty data
      const resultData: {
        success?: unknown
        errors?: {
          address: string
          type: number
          description: string
        }[]
      } = {
        success: undefined,
      }

      if (unwrappedCompleteData.success !== undefined) {
        const successKeys = Object.keys(unwrappedCompleteData.success)
        if (successKeys.length === 1 && successKeys[0] === 'value')
          resultData.success = unwrappedCompleteData.success.value
        else
          resultData.success = unwrappedCompleteData.success
      }

      if (unwrappedCompleteData.errors.length > 0)
        resultData.errors = unwrappedCompleteData.errors

      // console.log({ data, unwrappedCompleteData, resultData })

      return resultData
    },
    z.strictObject({
      success: successSchema.optional(),
      errors: errorSchema.optional(),
    }),
  )
}
