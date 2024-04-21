import { defineEndpoint } from '@directus/extensions-sdk'
import type { Accountability } from '@directus/types'
import type * as Services from '@directus/api/dist/services/index'

export default defineEndpoint({
  id: 'oauth-pop-up/callback',
  handler: async (router, context) => {
    const services = context.services as typeof Services

    // console.log(context)
    router.get('/', async (req, res) => {
      const accountability = 'accountability' in req ? req.accountability as Accountability : null

      if (accountability === null)
        return res.status(403).send('Unauthorized')

      const websocketService = new services.WebSocketService()
      const schema = await context.getSchema()

      const authenticationService = new services.AuthenticationService({ accountability, schema })

      // const result = await authenticationService.login('default', {})

      // console.log(result)

      // authService.schema()

      websocketService.clients().forEach((client) => {
        // https://discord.com/channels/725371605378924594/1145983963966492742/1231613111543398651
        /*
        if (client.uid === req.query.whoami) {
          client.accountability = accountability
          client.send(JSON.stringify({ type: 'auth', status: 'ok' }))
        }
        */
      })

      /*
      console.log('user=', accountability.user)
      console.log(accountability)
      console.log('whoami=', req.query.whoami)
      */

      return res.send('Hello, World! 2')
    })
  },
})
