import type { Ref } from 'vue'
import { createMachine } from 'xstate'
import { useMachine } from '@xstate/vue'
import type { GatewayCredentials } from '~/interfaces/deconz'

export const gatewayMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYBcwHcUE8B0AlgHYFoDEAwgPZFFgDGaA2gAwC6ioADlbKQTU4gAHogC0AdhZ4AnAEYALCwBsAJgCsLLduUAaEDkRzNAXxP7UGbPno06jYlDIQaYQkQBuVANZvLWXDxbWgY0RwRiL3p0ASJWNnihHj4wwSQRcQBmOTk8AA481Ty5DW0dfUMETNU5Mwt0AJs7UMcyMAAndqp2vC4AG3QAM26AWzx-ayDmhyIoCM8qaNS49kT05P400FEEDRk8DQk8hUyWOQl1I5YJCsRq2vMQCcDg+zDZts7u3oG0Yfaxs8miEZnNIosYjR4kw5Bx1rxNkQhDtVEo8Apjkp1Opzpc8tdbgglMo8Oo6k8GpNXi0Ph0uj1+kNRuNKS9pu8wQslrFoao4dwEctkYhVBJcnIZOpMiczhcrjcDIgFDJVOSgXgqINBn1iGBKOy1gKUrFhVUJPsWDJMlccXLioSJarHkCyABVLgQBoAAno7UgYCIYRQfVghpAGyF6R2YjkLDy+Rx6jUmjKKkJkgkatZ+E12t1eDp30iwYIEC9AEEAAoASS9vhwZAAYgRhF6CLBYABXMBhiMmqNGFhSvDKarHU64o5yQlYrNWQK5nV0AtfHqdoh+lD0AAWKAARn09c3W+2uz32ElBf3toPh6OijLJ-bFVUavkZB+rXkZMoMQoFHOjQalqS5uJA-CzHg5YQBAfodmQAByYDCMwF7wsaWwZAgxglKSxjKNitp4tOL6ZMoJKisqX4-n+AHOtmwF5suhZrkQ3hEFQmBEE2LZth23a9lemE7LGd5jo+dokZUyrSGS9HzjmIH5uBHJQTWdZgA2SEoYJGFIgO2E4qoeFJoRT5SUq6jGdacn1ApjGgQWEAQVAam1vWZCVn6HgCJ2oZoUaiKmiUo54FoRwScRhJkRREhUZk36-pigGTIuynORyziuHgsBoA0LL2WlzEZY4ulBQZon7AoNQyEORFTg6aikmYjwcRAcBCECl56aaYjqAouQFEUJTqOmci-s18lAcQpDdeVN4IJIsmpitaakfGtkUvZ1KgnNkYLZI8ZDcUpSpnoL6qD+KULkQoF7deWFiMqmT5IUJ2jaREqTXZQFFWA93CYgEinGF1zjrKUUvmIqLfVtv1KcuzmwPuh4QAD+kLUcxmHOD5mEqO12KUxYGrujpoSEcoMRROkmEqo0p4Jkn7UUlJx5ITDnKaueDrpuO4o-96HzVheSZC9OORQ1pFvt+n4JTRyVTalCMk-S7geCWZZVu5mlkwZhQkuFuO0y+s5KwuKsrmr67sZxGPhkJ9s7Mc6hhUzlo05D0m1bD6p-U5Ll6wtJTGFTxteyKYsHHFH7y6zCUc-7KmOG5GmVIF+1YXICWG2DkvPtJLAKPkFyJ5byeQdBsFwPAQuZyJOdh-nFlVF9FPxYltFl8TAeqQAIq4QdZ2R8ZG83M7fngI0tSYQA */
  id: 'gateway',

  tsTypes: {} as import('./useGateway.typegen').Typegen0,
  schema: {
    context: {} as {
      credentials: GatewayCredentials
    },
  },

  states: {
    init: {
      on: {
        Connect: 'connecting',
      },
    },

    connecting: {
      invoke: {
        src: 'connectToGateway',

        onDone: {
          target: 'online',
        },

        onError: [{
          target: 'offline.error.unreachable',
          cond: 'isUnreachable',
        }, {
          target: 'offline.error.invalid API key',
          cond: 'isInvalidAPIKey',
        }, 'offline.error.unknown'],
      },
    },

    online: {},

    offline: {
      states: {
        disabled: {},

        error: {
          states: {
            'unreachable': {
              on: {
                'Fix issue': '#gateway.offline.editing.Address',
              },
            },
            'invalid API key': {
              on: {
                'Fix issue': '#gateway.offline.editing.API key',
              },
            },
            'unknown': {
              on: {
                'Fix issue': '#gateway.offline.editing',
              },
            },
          },

          initial: 'unknown',
        },

        editing: {
          states: {
            'API key': {
              on: {
                Next: 'Done',
                Previous: 'Address',
              },
            },

            'Address': {
              on: {
                Next: 'API key',
              },
            },

            'Done': {
              type: 'final',
            },
          },

          initial: 'Address',

          onDone: '#gateway.connecting',
        },
      },

      initial: 'disabled',

      on: {
        Connect: 'connecting',
      },
    },
  },

  initial: 'init',

  on: {
    'Update credentials': '.init',
  },
})

export function useGateway(credentials: Ref<GatewayCredentials>) {
  const id = computed(() => credentials.value?.id)

  const machine = useMachine(gatewayMachine, {
    id: `${gatewayMachine.id}-${id.value}`,
  })
  // const id2 = toRef(credentials.value, 'id')

  const data = ref({})

  const connect = () => {

  }

  // Delay the connection for 1.5 seconds.
  const { stop } = useTimeoutFn(() => {
    connect()
  }, 100)

  const destroy = () => {
    stop()
  }

  return {
    id,
    credentials,
    machine,
    data,
    connect,
    destroy,
  }
}
