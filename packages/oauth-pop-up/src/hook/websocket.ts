import { defineHook } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'
import type { WebSocket } from 'ws'

type WebSocketClient = WebSocket & { uid: string | number, auth_timer: NodeJS.Timeout | null }

type Messages = {
  type: 'oauth-pop-up/whoami'
} | unknown

export default defineHook(({ action, init, env }, context) => {
  // const services = context.services as typeof Services

  // const websocketService = new services.WebSocketService()

  action('websocket.message', (params) => {
    const client = params.client as WebSocketClient
    const message = params.message as Messages

    if (typeof message !== 'object' || message === null || !('type' in message))
      return

    if (message.type === 'oauth-pop-up/whoami')
      client.send(JSON.stringify({ type: 'oauth-pop-up/whoami', data: { whoami: client.uid } }))

    /*
    websocketService.clients().forEach((client: WebSocketClient) => {
      if (client.uid === mainUid)
        client.send(JSON.stringify({ type: 'foo', data: mainUid }))
    })
    */
  })
  /*

  action('websocket.connect', ({ client }) => {
    // console.log('Connected!', client)
    // console.log(`Connected ! UUID=${client.uid}`)
  })

  action('websocket.close', ({ client, event }) => {
    // console.log('Connected!', client)
    // console.log(`Closed! UUID=${client.uid}`)
    // console.log(event)
  })
  */
})
