import type { Accountability } from '@directus/types'
import type { GlobalContext, KeySet } from '../types'
import { ForbiddenError, InvalidQueryError } from '@directus/errors'
import { updateBundleSignatures } from '../signature-editor'
import { asyncHandler, fetchUserContext } from '../utils'

export function signEndpoint(globalContext: GlobalContext) {
  const { router } = globalContext
  router.post('/sign/:id', asyncHandler(async (req, res) => {
    const accountability = 'accountability' in req ? req.accountability as Accountability : null

    if (typeof accountability?.user !== 'string')
      throw new ForbiddenError()

    const adminAccountability = structuredClone({
      ...accountability,
      admin: true,
    })

    const { type, state } = req.query
    const bundleID = req.params.id

    if (typeof bundleID !== 'string')
      throw new InvalidQueryError({ reason: 'Invalid bundle id' })

    if (type !== 'system')
      throw new InvalidQueryError({ reason: 'Only system signature are supported for now' })

    if (typeof state !== 'string')
      throw new InvalidQueryError({ reason: 'Invalid type' })

    if (!['alpha', 'beta', 'stable'].includes(state))
      throw new InvalidQueryError({ reason: 'Invalid state' })

    const { settings, userInfo } = await fetchUserContext(adminAccountability, accountability.user, globalContext)

    if (!userInfo.is_contributor)
      throw new ForbiddenError()

    const {
      public_key_beta,
      private_key_beta,
      public_key_stable,
      private_key_stable,
    } = settings

    if (!public_key_beta || !private_key_beta || !public_key_stable || !private_key_stable)
      throw new InvalidQueryError({ reason: 'The server is missing the system keys, please contact an admin.' })

    const betaKeySet: KeySet = {
      public: public_key_beta,
      private: private_key_beta,
      type: 'system',
    }

    const stableKeySet: KeySet = {
      public: public_key_stable,
      private: private_key_stable,
      type: 'system',
    }

    const addKeys: KeySet[] = []
    const removeKeys: KeySet[] = []

    switch (state) {
      case 'alpha':
        removeKeys.push(betaKeySet)
        removeKeys.push(stableKeySet)
        break
      case 'beta':
        addKeys.push(betaKeySet)
        removeKeys.push(stableKeySet)
        break
      case 'stable':
        removeKeys.push(betaKeySet)
        addKeys.push(stableKeySet)
        break
    }

    await updateBundleSignatures(globalContext, accountability, [bundleID], addKeys, removeKeys)

    res.json({ success: true, type, state })
  }))
}
