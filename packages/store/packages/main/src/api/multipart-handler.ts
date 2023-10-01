import type { RequestHandler } from 'express'
import { createError } from '@directus/errors'
import Busboy from 'busboy'

const ContentTooLargeError = createError('CONTENT_TOO_LARGE', 'Uploaded content is too large.', 413)

function InvalidPayloadError(message: string) {
  return createError(
    'INVALID_PAYLOAD',
    message,
    400,
  )
}

export type BlobsPayload = Record<string, {
  blob: Blob
  meta: Record<string, string | boolean | null>
}>

export const multipartHandler: RequestHandler<object, any, BlobsPayload> = (req, res, next) => {
  if (req.is('multipart/form-data') === false)
    return next()

  let headers

  if (req.headers['content-type']) {
    headers = req.headers
  }
  else {
    headers = {
      ...req.headers,
      'content-type': 'application/octet-stream',
    }
  }

  const busboy = Busboy({
    headers,
    defParamCharset: 'utf8',
    limits: {
      fileSize: 5000000,
    },
  })

  let currentMeta: BlobsPayload[string]['meta'] = {}

  const payload: BlobsPayload = {}

  busboy.on('field', (fieldname, val) => {
    let fieldValue: string | null | boolean = val

    if (typeof fieldValue === 'string' && fieldValue.trim() === 'null')
      fieldValue = null
    if (typeof fieldValue === 'string' && fieldValue.trim() === 'false')
      fieldValue = false
    if (typeof fieldValue === 'string' && fieldValue.trim() === 'true')
      fieldValue = true
    currentMeta[fieldname] = fieldValue
  })

  busboy.on('file', async (uploadUUID, fileStream) => {
    fileStream.on('limit', () => {
      const error = ContentTooLargeError
      next(error)
    })

    const chunks: BlobPart[] = []

    fileStream.on('data', (data: BlobPart) => {
      chunks.push(data)
    }).on('close', () => {
      payload[uploadUUID] = {
        blob: new Blob(chunks),
        meta: structuredClone(currentMeta),
      }
      currentMeta = {}
    })

    return undefined
  })

  busboy.on('error', (error: Error) => {
    console.error(error)
    next(error)
  })

  busboy.on('close', () => {
    if (Object.keys(payload).length === 0)
      return next(InvalidPayloadError('No files uploaded'))

    req.body = payload

    return next()
  })

  try {
    req.pipe(busboy)
  }
  catch (e) {
    console.error(e)
  }
}
