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

type Files = Record<string, Blob>

type Payload = {
  files: Files
} & Omit<Record<string, string | boolean | null | Files>, 'files'>

export const multipartHandler: RequestHandler<object, any, Payload> = (req, res, next) => {
  if (req.is('multipart/form-data') === false)
    return next()

  console.log('multipartHandler A')

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

  console.log('multipartHandler B')
  const busboy = Busboy({
    headers,
    defParamCharset: 'utf8',
    limits: {
      fileSize: 5000000,
    },
  })

  type Files = Record<string, Blob>
  const payload: {
    files: Blob[]
  } & Omit<Record<string, string | boolean | null | Files>, 'files'> = {
    files: [],
  }

  busboy.on('field', (fieldname, val) => {
    console.log('multipartHandler C')
    let fieldValue: string | null | boolean = val

    if (typeof fieldValue === 'string' && fieldValue.trim() === 'null')
      fieldValue = null
    if (typeof fieldValue === 'string' && fieldValue.trim() === 'false')
      fieldValue = false
    if (typeof fieldValue === 'string' && fieldValue.trim() === 'true')
      fieldValue = true
    payload[fieldname] = fieldValue
  })

  busboy.on('file', async (uploadUUID, fileStream, { filename }) => {
    console.log('multipartHandler D')
    console.log('Got File', uploadUUID, filename)
    if (!filename)
      return busboy.emit('error', InvalidPayloadError('File is missing filename'))

    fileStream.on('limit', () => {
      const error = ContentTooLargeError
      next(error)
    })

    const chunks = []
    for await (const chunk of fileStream)
      chunks.push(chunk)

    payload.files.push(new Blob(chunks))

    return undefined
  })

  busboy.on('error', (error: Error) => {
    console.log('multipartHandler E')
    console.error(error)
    next(error)
  })

  busboy.on('close', () => {
    console.log('multipartHandler FE')

    console.log(payload.files)
    console.log(payload.files.length)

    if (Object.keys(payload.files).length === 0)
      return next(InvalidPayloadError('No files uploaded'))

    req.body = payload
    console.log('Done multipartHandler')
    return next()
  })

  try {
    req.pipe(busboy)
  }
  catch (e) {
    console.error(e)
  }
}
