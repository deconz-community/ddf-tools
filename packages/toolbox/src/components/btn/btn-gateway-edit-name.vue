<script setup lang="ts">
import type { RequestResultForAlias } from '@deconz-community/rest-client'
import { getParamZodSchema } from '@deconz-community/rest-client'
import { gatewayRequest } from '~/machines/gateway'

const props = defineProps<{
  gateway: string
}>()

const machines = createUseAppMachine()
const gatewayMachine = machines.use('gateway', computed(() => ({ id: props.gateway })))

const editName = useDialogAction(() => {
  const config = gatewayMachine.state?.context.config

  if (!config)
    return

  const currentName = config.name

  return {
    title: 'Update gateway name',
    contentComponentProps: {
      label: 'Name',
      placeholder: currentName,
    },
    defaultValue: currentName,
    confirmationText: 'Save',
    schema: getParamZodSchema('updateConfig', 'config').shape.name,
    onSubmit: async (name) => {
      if (name === currentName)
        return toast.info('No changes made')

      /*
      gatewayMachine.send({
        type: 'REQUEST',
        alias: 'updateConfig',
        params: {
          config: { name },
        },
        options: {
          onDone: (r) => {
            const response = r as any

            if (response.success) {
              toast.success('Gateway name updated')
              gatewayMachine.send({ type: 'REFRESH_CONFIG' })
            }
            else {
              toast.error('Failed to update gateway name')
              console.error(response)
            }
          },
        },
      })
      */

      gatewayMachine.send(gatewayRequest('updateConfig', {
        config: { name },

      }, {
        onDone: (r) => {
          const responses = r as RequestResultForAlias<'updateConfig'>

          responses.forEach((response) => {
            if (response.isOk()) {
              toast.success('Gateway name updated')
              gatewayMachine.send({ type: 'REFRESH_CONFIG' })
            }
            else {
              console.error(response.error)
              toast.error('Failed to update gateway name', {
                description: response.error.message,
                id: 'error-toast',
                duration: 5000,
                onAutoClose: () => {},
                onDismiss: () => {},
                important: true,
              })
            }
          })
        },
      }))

      /*
      gatewayMachine.send(gatewayRequest('updateConfig', { config: {
        name,
      } }))
      */
      // params: { name },
      /*
        options: {
          onDone: (response) => {
            if (response.success) {
              toast.success('Gateway name updated')
              gatewayMachine.send({ type: 'REFRESH_CONFIG' })
            }
            else {
              toast.error('Failed to update gateway name')
              console.error(response)
            }
          },
        },
        */

      /*
      gatewayMachine.send(gatewayRequest('updateConfig', { name }, {
        onDone: (response) => {
          if (response.success) {
            toast.success('Gateway name updated')
            gatewayMachine.send({ type: 'REFRESH_CONFIG' })
          }
          else {
            toast.error('Failed to update gateway name')
            console.error(response)
          }
        },
      }))
      */
    },
  }
})
</script>

<template>
  <v-btn icon="mdi-pencil" @click="editName()" />
</template>
