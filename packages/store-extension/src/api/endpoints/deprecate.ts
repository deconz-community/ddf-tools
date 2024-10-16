import type { Accountability } from '@directus/types'
import type { Collections } from '../../client'
import type { GlobalContext, KeySet } from '../types'
import { ForbiddenError, InvalidQueryError } from '@directus/errors'
import { updateBundleSignatures } from '../signature-editor'
import { asyncHandler, fetchUserContext } from '../utils'

export function deprecateEndpoint(globalContext: GlobalContext) {
  const { router, context, services, schema } = globalContext

  router.post('/deprecate', asyncHandler(async (req, res) => {
    const accountability = 'accountability' in req ? req.accountability as Accountability : null

    const userId = accountability?.user

    if (typeof accountability?.user !== 'string' || !userId)
      throw new ForbiddenError()

    const adminAccountability = structuredClone({
      ...accountability,
      admin: true,
    })

    const serviceOptions = { schema, knex: context.database, accountability: adminAccountability }

    const { message, bundle_id } = req.query

    if (typeof message === 'string' && message !== 'null' && message.length < 10)
      throw new InvalidQueryError({ reason: 'You must provide a message with at least 10 characters or \'null\'' })

    if (typeof bundle_id !== 'string')
      throw new InvalidQueryError({ reason: 'You must provide a bundle_id' })

    const { userInfo, settings } = await fetchUserContext(adminAccountability, accountability.user, globalContext)

    if (!userInfo.is_contributor)
      throw new InvalidQueryError({ reason: 'You don\'t have permission to modify a bundle with that UUID because you are not the maintainer of it' })

    const { public_key_deprecated, private_key_deprecated } = settings

    if (!public_key_deprecated || !private_key_deprecated)
      throw new InvalidQueryError({ reason: 'The server is missing the system keys, please contact an admin.' })

    const deprecatedKeySet: KeySet = {
      private: private_key_deprecated,
      public: public_key_deprecated,
      type: 'system',
    }

    const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)

    const deprecation_message = message === 'null' ? null : message as string

    await bundleService.updateOne(bundle_id as string, {
      deprecation_message,
    })

    await updateBundleSignatures(
      globalContext,
      adminAccountability,
      [bundle_id as string],
      // addKeys
      deprecation_message === null ? [] : [deprecatedKeySet],
      // removeKeys
      deprecation_message === null ? [deprecatedKeySet] : [],
    )

    return res.json({ success: true })
  }))
}
