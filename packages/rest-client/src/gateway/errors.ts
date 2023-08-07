import { z } from 'zod'

export const errors = {
  default: 'Unknown: Something went wrong.',
  200: 'OK: Request succeded.',
  201: 'Created: A new resource was created.',
  202: 'Accepted: Request will be processed but isn\'t finished yet.',
  304: 'Not Modified: Is returned if the request had the If-None-Match header and the ETag on the resource was the same.',
  400: 'Bad request: The request was not formated as expected or missing parameters.',
  401: 'Unauthorized: Authorization failed.',
  403: 'Forbidden: The caller has no rights to access the requested URI.',
  404: 'Resource Not Found: The requested resource was not found.',
  501: 'Not Implemented: Nothing to see here.',
  503: 'Service Unavailable: The device is not connected to the network or too busy to handle further requests.',
} as const

export function getErrors(
  options: {
    successSchema?: z.ZodTypeAny
    manyErrors?: boolean
  } = {},
  ...codes: (keyof typeof errors | 'default')[]
) {
  const schema = z.object({
    success: options.successSchema ?? z.undefined(),
    error: options.manyErrors === true
      ? z.record(z.object({
        type: z.number(),
        description: z.string(),
      }))
      : z.object({
        type: z.number(),
        description: z.string(),
      }),
  })

  return codes.map((code) => {
    return {
      status: code,
      description: errors[code],
      schema,
    }
  })
}
