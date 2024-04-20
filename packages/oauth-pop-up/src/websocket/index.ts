import { defineHook } from '@directus/extensions-sdk'

export default defineHook(({ action, init, env }) => {
  action('websocket.message', (message, client) => {
    // console.log('message', message, client)
  })

  action('websocket.connect', ({ client }) => {
    // console.log('Connected!', client)
    console.log(`Connected 4! UUID=${client.uid}`)
  })

  action('websocket.close', ({ client, event }) => {
    // console.log('Connected!', client)
    console.log(`Closed! UUID=${client.uid}`)
    console.log(event)
  })
})
