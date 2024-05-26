import type { Accountability } from '@directus/types'
import { asyncHandler } from '../utils'
import type { Collections } from '../../client'
import type { GlobalContext } from '../types'

export function searchEndpoint({ router, context, services, schema }: GlobalContext) {
  router.get('/search', asyncHandler(async (req, res) => {
    const accountability = 'accountability' in req ? req.accountability as Accountability : null
    const serviceOptions = { schema, knex: context.database, accountability }

    const product = typeof req.query.product === 'string' && req.query.product !== '' ? req.query.product : null
    const manufacturer = typeof req.query.manufacturer === 'string' && req.query.manufacturer !== '' ? req.query.manufacturer : null
    const model = typeof req.query.model === 'string' && req.query.model !== '' ? req.query.model : null
    const hasKey = typeof req.query.hasKey === 'string' && req.query.hasKey !== '' ? req.query.hasKey : null
    const showDeprecated = req.query.showDeprecated === 'true'
    let limit = 20

    const subquery = context.database('bundles')
      .select('bundles.ddf_uuid')
      .max('bundles.source_last_modified as max_date')
      .orderBy('max_date', 'desc')
      .groupBy('ddf_uuid')

    if (product)
      subquery.where(context.database.raw('LOWER(`product`) LIKE ?', [`%${product.toLowerCase()}%`]))

    if ((manufacturer) || (model)) {
      subquery
        .join('bundles_device_identifiers', 'bundles.id', '=', 'bundles_device_identifiers.bundles_id')
        .join('device_identifiers', 'bundles_device_identifiers.device_identifiers_id', '=', 'device_identifiers.id')

      if (manufacturer)
        subquery.where(context.database.raw('LOWER(`manufacturer`) LIKE ?', [`%${manufacturer.toLowerCase()}%`]))

      if (model)
        subquery.where(context.database.raw('LOWER(`model`) LIKE ?', [`%${model.toLowerCase()}%`]))
    }

    if (hasKey) {
      subquery
        .join('signatures', 'bundles.id', '=', 'signatures.bundle')
        .where('signatures.key', hasKey)
    }

    if (showDeprecated === false) {
      subquery
        .join('ddf_uuids', 'bundles.ddf_uuid', '=', 'ddf_uuids.id')
        .whereNull('ddf_uuids.deprecation_message')
        .whereNull('bundles.deprecation_message')
    }

    const query = context.database
      .select('bundles.id')
      .from('bundles')
      .join(subquery.as('subquery'), function () {
        this.on('bundles.ddf_uuid', '=', 'subquery.ddf_uuid')
          .andOn('bundles.source_last_modified', '=', 'subquery.max_date')
      })

    if (typeof req.query.limit === 'string' && req.query.limit !== '') {
      limit = Math.min(Number.parseInt(req.query.limit), limit)
      query.limit(limit)
      if (typeof req.query.page === 'string' && req.query.page !== '')
        query.offset(limit * (Number.parseInt(req.query.page) - 1))
    }

    query.orderBy('bundles.source_last_modified', 'desc')

    const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)
    const items = await bundleService.readByQuery({
      fields: [
        'id',
        'product',
        'ddf_uuid',
        'source_last_modified',
        'content_hash',
        'device_identifiers.device_identifiers_id.manufacturer',
        'device_identifiers.device_identifiers_id.model',
        'info',
        'signatures.key',
        'signatures.type',
      ],
      filter: {
        id: {
          _in: (await query).map(item => item.id),
        },
      },
      sort: ['-source_last_modified'],
    })

    let totalCount = Number.POSITIVE_INFINITY
    if (items.length < limit) {
      totalCount = items.length
    }
    else {
      const queryCount = query
        .clone()
        .clearSelect()
        .clear('limit')
        .clear('offset')
        .count('bundles.id as count')
        .clear('join')
        .join(subquery.clone().as('subquery'), function () {
          this.on('bundles.ddf_uuid', '=', 'subquery.ddf_uuid')
            .andOn('bundles.source_last_modified', '=', 'subquery.max_date')
        })

      if (showDeprecated === false)
        queryCount.join('ddf_uuids', 'bundles.ddf_uuid', '=', 'ddf_uuids.id')

      const countResult = (await queryCount.clone()).shift()

      if (countResult && countResult.count && typeof countResult.count === 'number')
        totalCount = countResult.count
    }

    res.json({ items, totalCount })
  }))
}