import { defineEndpoint } from '@directus/extensions-sdk'

export default defineEndpoint({
  id: 'bundle',
  handler: (router) => {
    router.get('/', (_req, res) => res.send('Hello, World!fazefaez'))
  },
})
