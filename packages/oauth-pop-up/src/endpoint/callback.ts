import { defineEndpoint } from '@directus/extensions-sdk'

export default defineEndpoint({
  id: 'oauth-pop-up/callback',
  handler: async (router, context) => {
    router.get('/', (_req, res) => res.send('Hello, World! 2'))
  },
})
