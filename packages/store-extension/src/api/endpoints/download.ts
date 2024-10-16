import type { Accountability } from '@directus/types'
import type { Collections } from '../../client'
import type { GlobalContext } from '../types'
import { Buffer } from 'node:buffer'
import { Stream } from 'node:stream'
import { InvalidQueryError } from '@directus/errors'
import slugify from '@sindresorhus/slugify'
import pako from 'pako'
import { asyncHandler } from '../utils'

export function downloadEndpoint({ router, context, services, schema }: GlobalContext) {
  router.get('/download/:id', asyncHandler(async (req, res) => {
    const accountability = 'accountability' in req ? req.accountability as Accountability : null

    const serviceOptions = { schema, knex: context.database, accountability }

    const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)

    if (typeof req.params.id !== 'string')
      throw new InvalidQueryError({ reason: 'Invalid bundle id' })

    const bundle = await bundleService.readOne(req.params.id, {
      fields: [
        'product',
        'content',
      ],
    })

    if (!bundle.content)
      throw new InvalidQueryError({ reason: 'Bundle not found' })

    const fileName = `${slugify(`${bundle.product}-${req.params.id.substring(req.params.id.length - 10)}`)}.ddb`

    const buffer = Buffer.from(bundle.content, 'base64')
    const decompressed = Buffer.from(pako.inflate(buffer))
    const readStream = new Stream.PassThrough()
    readStream.end(decompressed)

    res.set('Content-disposition', `attachment; filename=${fileName}`)
    res.set('Content-Type', 'application/x-deconz-ddf-bundle')

    readStream.pipe(res)
  }))
}
