import { ForbiddenError, InvalidQueryError } from '@directus/errors'
import type { Accountability } from '@directus/types'
import type { Collections } from '../../client'
import type { GlobalContext, KeySet } from '../types'
import { asyncHandler, fetchUserContext } from '../utils'
import { updateBundleSignatures } from '../signature-editor'

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

    const UUIDService = new services.ItemsService<Collections.DdfUuids>('ddf_uuids', serviceOptions)

    const { type, message, ddf_uuid, bundle_id } = req.query

    if (typeof type !== 'string' || !['bundle', 'version'].includes(type))
      throw new InvalidQueryError({ reason: 'You can only deprecate bundle or version' })
    if (typeof ddf_uuid !== 'string')
      throw new InvalidQueryError({ reason: 'You must provide a ddf_uuid' })
    if (typeof message === 'string' && message !== 'null' && message.length < 10)
      throw new InvalidQueryError({ reason: 'You must provide a message with at least 10 characters or \'null\'' })

    if (type === 'version' && typeof bundle_id !== 'string')
      throw new InvalidQueryError({ reason: 'You must provide a bundle_id' })

    const { userInfo, settings } = await fetchUserContext(adminAccountability, accountability.user, globalContext)

    const { public_key_deprecated, private_key_deprecated } = settings

    if (!public_key_deprecated || !private_key_deprecated)
      throw new InvalidQueryError({ reason: 'The server is missing the system keys, please contact an admin.' })

    const deprecatedKeySet: KeySet = {
      private: private_key_deprecated,
      public: public_key_deprecated,
      type: 'system',
    }

    const uuidInfo = (await UUIDService.readByQuery({
      fields: [
        'id',
        'user_created',
      ],
      filter: {
        id: { _eq: ddf_uuid },
      },
    })).shift()

    if (uuidInfo === undefined)
      throw new InvalidQueryError({ reason: 'UUID not found' })

    if (uuidInfo.user_created !== userId && !userInfo.is_contributor)
      throw new InvalidQueryError({ reason: 'You don\'t have permission to modify a bundle with that UUID because you are not the maintainer of it' })

    const bundleService = new services.ItemsService<Collections.Bundles>('bundles', serviceOptions)

    const bundle = await bundleService.readOne(bundle_id as string, {
      fields: ['ddf_uuid'],
    })

    if (bundle.ddf_uuid !== ddf_uuid)
      throw new InvalidQueryError({ reason: 'The bundle does not match the UUID' })

    const affectedBundles: string[] = []
    const deprecation_message = message === 'null' ? null : message as string

    if (type === 'bundle') {
      affectedBundles.push(bundle_id as string)
      await UUIDService.updateOne(ddf_uuid, {
        deprecation_message,
      })
    }

    if (type === 'version') {
      const bundlesList = await bundleService.readByQuery({
        fields: ['id'],
        filter: {
          ddf_uuid: { _eq: ddf_uuid },
        },
      })

      affectedBundles.push(...bundlesList.map(bundle => bundle.id))

      await bundleService.updateOne(bundle_id as string, {
        deprecation_message,
      })
    }

    if (affectedBundles.length > 0) {
      await updateBundleSignatures(
        globalContext,
        adminAccountability,
        affectedBundles,
        // addKeys
        deprecation_message === null ? [] : [deprecatedKeySet],
        // removeKeys
        deprecation_message === null ? [deprecatedKeySet] : [],
      )
    }

    return res.json({ success: true })
  }))
}
