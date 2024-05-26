import { ForbiddenError, InvalidQueryError } from '@directus/errors'
import type { Accountability } from '@directus/types'
import type { Collections } from '../../client'
import type { InstallFunctionParams } from '../types'
import { asyncHandler } from '../utils'

export function generateUUIDEndpoint(params: InstallFunctionParams) {
  const { router, context, services, schema } = params

  router.get('/generateUUID', asyncHandler(async (req, res, _next) => {
    const accountability = 'accountability' in req ? req.accountability as Accountability : null

    if (typeof accountability?.user !== 'string')
      throw new ForbiddenError()

    const adminAccountability = structuredClone({
      ...accountability,
      admin: true,
    })

    const serviceOptions = { schema, knex: context.database, accountability: adminAccountability }

    const uuidCount = Number(req.query.count ?? 1)

    if (uuidCount > 100)
      throw new InvalidQueryError({ reason: 'You can only generate 100 UUIDs at a time' })

    const UUIDService = new services.ItemsService<Collections.DdfUuids>('ddf_uuids', serviceOptions)

    const expire_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 3) // 3 weeks

    const uuid = await UUIDService.createMany(Array.from({ length: uuidCount }, () => ({ expire_at })))

    res.json({ expire_at, uuid })
  }))
}
