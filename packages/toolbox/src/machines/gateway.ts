import { assign, createMachine, sendParent, spawn } from 'xstate'
import { FindGateway } from '@deconz-community/rest-client'
import type { FindGatewayResult, Gateway, Response } from '@deconz-community/rest-client'
import { Ok, type Result } from 'ts-results-es'
import type { GatewayCredentials } from './app'
import { deviceMachine } from './device'
import type { UseAppMachine } from '~/composables/useAppMachine'

export interface gatewayContext {
  credentials: GatewayCredentials
  gateway?: ReturnType<typeof Gateway>
  devices: Record<string, UseAppMachine<'device'>>
  config: Response<'getConfig'>['success']
}

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8DEAqgA4TpgAEAxgE6RgB2aAligDawDaADALqKhEA9rCbNB9fiAAeiACwAOAHQAmAIzz5qgGyrlyzVtkBmAKwAaEDkQmA7IpNdHRo7ICcq2VpNHXAX18WqBjY+ACiEKJUtBAMzGycvJJCImISSNKIHnqK8q5c8jZcssomrvLGFlYIarIqyoaussYF8so2-oFkIYpM9KJ4UrBoZIooAGYY1AAUDlwAlHhBWLg9fWjcfOnJokzikjII8lz2JrKFpbNqNrKViPquikVabVwurkY2NlpaHSBL3ZRxPQwJRmPQoHgIOIwKsAG6CADWMP+K0B9GBoN6UAQvXhlHQu3oGw2SWEOz26QOAFoTIotFx3kYuDYmSZcoYbLcEKdVIpCkZVILVI0TNoTL8UThFGiMWCIVDgXDEciuqigSC5Tj6HiCeJiapNgIyal9ohTA9bK8XD4jqZVEYuSZDIpiq5CvbhblZOKAn9VVKZRqsZDoUqkYpJdL1ZjwVqdalicpDSBtibKWanTkbA4Sjps0Z5FytDYlHpNNdZNovkZlBL-VH0UHwSHFbjlRH64GY9i2-iE7wOEZk6nCaaEAW7GyLm62s5VE6uTY3XVy00q1oa3XgitxKxejCmBBWGA8AAlMBjWiwAAW5BisKYlDgJK2xtH6YQVK05UUwpKmlcPIdALR0WRXJlhQ8BRlFkLdlilXd9x6I8T0GYYMFGCYwGmVRHDwxwFkjRDWxQl8jRSd9QGpLxaUacp7SKVwN2LItSkUN0vkcbNlFeZQjDg7piJhAAFQRBD3cE7zAB8n1gFsD21dsxjANBKGvAARaTH2fRJXwoikqMQL8bF5Jj8hKXC8y0VwuUrWjvF0QVvT45wBJ3MYxgkk8AGFo3WXTyPJNJDIQBRaQ8YDGl0VwTG8G5LDNJicgc3JmS4ec9HaX0iI8rzFGw6hBGoRQAFd6FoFA1JQAAjY88HCSIaDoRgWHYMiUzfAyMgQXD5C0PkvD6wCjmMUVQKMcD0vcJpWlg7L60EXKkIKoq4TYQ9yAAQWEgBJcgkTCCI0CiZq4jagKOv04Lut6-qvjZayyiKO0i1aPl9D-VR3S4No3IQpbFRW4qyoRehBEweh6qOk6Yha+J2pHLqDlugaHuG56xoSw4GXegCrnSn75D+xRFs85ajqxRRtr2g68GE2gH0EEqEmHTrruRlwlH5Fx6lseoSiLep2KMb4+NkZkbVUYnSbyyAdnBKmIAgK85IAOTAKR-NZq6x3na4+StYovBsfnzCx55+veUWXAlsopd+MGYngdJJVJHWPypGLeRMEo8hZQolx+rkqWUB5AMAtKjiYwDXPm7cpV6UQ3aCsc+vsflK20c0FC0LkeOOE2vG-Jy+PkAtia7OVk7TEK1C5D4JtMAVvzeUpv2l+gvOryjus9157F9iWA7yZQ880F1vDUJ1XkLom4-gknO6Qw9j27pGjPkWKB9KIfmRHx1izqJjSntekzn4+fBKXxVRPErEpJkuA1-ZoymjsV4hW8dwCiaeKqlOCaJsmJ9U+CLZi0sAZgGfmOEsDwvo8SaG6ek5Rc5Yx8AXfQxRmTWR0F9CBZNFQRFgDVY8EBoEfnUC4RQAp7i2DdD4M2VQFDHDdK0CsJYJxOnwbLaghVqDkJCmXOw8CihuE4ig2yJZwLASwWcIo3Dlq8NWmVCqVVapQL0inD8uQ7CpSXN8G0oobJYydLSE2ZcppQVmgowGSjiq4nWhALau19pgCqIFGu3UNDhRNqIpB+RPCvWULjT631fqX3cgQmEQNSr0FBuDa6iMX4IDyLUHizgaz5h9tmLkRxeTmNCQTcJnR44k0gflCm4IBE3SZAXQ2vNC4CyxmcB4Pgc4ln0H1NkNjomVKgFTFxB1qnIxmgbOcnpChMVQVUb8tJjBF03qYHic8SkLxluTeW-TNpKxVsMzIozuaCjKJMwwB9+pej6hoHi6hRT+H8EAA */
  id: 'gateway',
  predictableActionArguments: true,
  tsTypes: {} as import('./gateway.typegen').Typegen0,
  schema: {
    context: {} as gatewayContext,
    events: {} as | {
      type: 'EDIT_CREDENTIALS' | 'DONE' | 'NEXT' | 'PREVIOUS' | 'SAVE' | 'CONNECT' | 'REFRESH_DEVICES'
    } | {
      type: 'UPDATE_CREDENTIALS'
      data: GatewayCredentials
    },
    services: {} as {
      connectToGateway: {
        data: FindGatewayResult
      }
      fetchDevices: {
        data: Result<string[], never>
      }
      createApiKey: {
        data: Result<string, never>
      }
    },
  },

  context: {
    credentials: {
      apiKey: '<nouser>',
      id: '<unknown>',
      name: '',
      URIs: {
        api: [],
        websocket: [],
      },
    },
    gateway: undefined,
    devices: {},
    config: undefined,
  },

  states: {
    init: {
      after: {
        500: 'connecting',
      },
    },

    connecting: {
      invoke: [{
        src: 'connectToGateway',

        onDone: [{
          target: 'online.poolingDevices',
          cond: 'isOk',
          actions: 'useClient',
        }, {
          target: 'offline.error.unreachable',
          cond: 'isUnreachable',
        }, {
          target: 'offline.error.invalidApiKey',
          cond: 'isInvalidAPIKey',
        }, 'offline.error'],
      }],
    },

    online: {
      states: {
        idle: {
          on: {
            REFRESH_DEVICES: 'poolingDevices',
          },

          after: {
            10000000: 'poolingDevices',
          },
        },

        poolingDevices: {
          invoke: {
            src: 'fetchDevices',

            onDone: {
              target: 'idle',
              actions: 'updateDevices',
            },

            id: 'fetchDevices',
          },
        },
      },

      initial: 'idle',
      exit: 'updateDevices',
    },

    offline: {
      states: {
        disabled: {},

        error: {
          states: {
            unreachable: {
              on: {
                EDIT_CREDENTIALS: '#gateway.offline.editing.address',
              },
            },
            invalidApiKey: {
              on: {
                EDIT_CREDENTIALS: '#gateway.offline.editing.apiKey',
              },
            },
            unknown: {
              on: {
                EDIT_CREDENTIALS: '#gateway.offline.editing',
              },
            },
          },

          initial: 'unknown',
        },

        editing: {
          states: {
            apiKey: {
              on: {
                PREVIOUS: 'address',
              },

            },

            address: {
              on: {
                NEXT: 'apiKey',
              },
            },
          },

          initial: 'address',
        },
      },

      initial: 'disabled',

      on: {
        CONNECT: 'connecting',
      },
    },
  },

  initial: 'init',

  on: {
    UPDATE_CREDENTIALS: {
      target: '.init',
      actions: ['updateCredentials', 'saveSettings'],
    },

    EDIT_CREDENTIALS: '.offline.editing',
  },

}, {
  services: {
    connectToGateway: context => FindGateway(context.credentials.URIs.api, context.credentials.apiKey, context.credentials.id),
    fetchDevices: context => new Promise((resolve, reject) => {
      if (!context.gateway)
        return reject(new Error('No gateway client'))
      context.gateway.getDevices().then((result) => {
        resolve(Ok(result.success!))
      })
    }),

  },
  actions: {
    useClient: assign({
      gateway: (context, event) => event.data.unwrap().gateway,
    }),
    updateCredentials: assign({
      credentials: (context, event) => event.data,
    }),

    saveSettings: sendParent({ type: 'SAVE_SETTINGS' }),

    updateDevices: assign({
      devices: (context, event) => {
        const devices = context.devices

        const newList = event.type === 'done.invoke.fetchDevices' ? event.data.unwrap() : []
        const oldList = objectKeys(devices)

        if (newList.length > 0 && !context.gateway)
          throw new Error('No gateway client')

        newList
          .filter(uuid => !oldList.includes(uuid))
          .forEach((uuid) => {
            devices[uuid] = spawn(deviceMachine.withContext({
              id: uuid,
              gateway: context.gateway!,
              data: undefined,
            }), uuid)
          })

        oldList
          .filter(uuid => !newList.includes(uuid))
          .forEach((uuid) => {
            // TODO Fix this
            devices[uuid].stop?.()
            delete devices[uuid]
          })

        return devices
      },
    }),
  },
  guards: {
    isOk: (context, event) => event.data.isOk()
      && event.data.unwrap().code === 'ok',
    // isErr: (context, event) => event.data.isErr(),
    // TODO, need to handle the bridge_id_mismatch error
    isInvalidAPIKey: (context, event) => event.data.isOk()
      && ['invalid_api_key', 'bridge_id_mismatch'].includes(event.data.unwrap().code),
    isUnreachable: (context, event) => event.data.isErr()
      && event.data.unwrapErr().code === 'unreachable',
  },
})
