import { defineEndpoint } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'

import { searchEndpoint } from './endpoints/search'
import { uploadEndpoint } from './endpoints/upload'
import { downloadEndpoint } from './endpoints/download'
import { signEndpoint } from './endpoints/sign'
import { deprecateEndpoint } from './endpoints/deprecate'
import { generateUUIDEndpoint } from './endpoints/generateuuid'
import { userinfoEndpoint } from './endpoints/userinfo'

export default defineEndpoint({
  id: 'bundle',
  handler: async (router, context) => {
    const services = context.services as typeof Services
    const schema = await context.getSchema()

    const params = { router, context, services, schema }
    searchEndpoint(params)
    uploadEndpoint(params)
    downloadEndpoint(params)
    userinfoEndpoint(params)
    signEndpoint(params)
    deprecateEndpoint(params)
    generateUUIDEndpoint(params)
  },
})
