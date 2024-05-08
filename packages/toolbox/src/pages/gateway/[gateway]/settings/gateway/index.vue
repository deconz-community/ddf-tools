<script setup lang="ts">
import { getParamZodSchema } from '@deconz-community/rest-client'
import { gatewayRequest } from '~/machines/gateway'

const props = defineProps<{
  gateway: string
}>()

const machines = createUseAppMachine()
const gatewayMachine = machines.use('gateway', computed(() => ({ id: props.gateway })))

const config = computed(() => gatewayMachine.state?.context.config)

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
    schema: getParamZodSchema('updateConfig', 'body', 'name'),
    onSubmit: async (name) => {
      if (name === currentName)
        return toast.info('No changes made')

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
    },
  }
})

function test() {
  console.log('test')
}
</script>

<template>
  <v-card v-if="config" class="ma-2">
    <v-card-title class="ma-2">
      {{ config.name }}
      <v-btn icon="mdi-pencil" density="comfortable" @click="editName()" />
      <!--
      <v-btn icon="mdi-pencil" density="comfortable" @click="editName()" />
      <v-btn icon="mdi-refresh" density="comfortable" @click="gatewayMachine.send({ type: 'REFRESH_CONFIG' })" />
      -->
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-btn color="primary" @click="test()">
            Test
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
