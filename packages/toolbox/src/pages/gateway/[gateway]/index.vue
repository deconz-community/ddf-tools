<script setup lang="ts">
import { useConfirm } from 'vuetify-use-dialog'
import { VTextField } from 'vuetify/components'

import { toast } from 'vuetify-sonner'

const props = defineProps<{
  gateway: string
}>()

const machines = createUseAppMachine()
const createConfirm = useConfirm()

const gatewayMachine = machines.use('gateway', computed(() => ({ id: props.gateway })))
const config = computed(() => gatewayMachine.state?.context.config)
const gateway = computed(() => gatewayMachine.state?.context.gateway)

const drawer = ref(false)
onMounted(() => setTimeout(() => drawer.value = true, 0))

async function editName() {
  const input = ref(config.value?.name)
  const textField = ref<VTextField>()

  const rules = [
    (v: string) => !!v || 'Name is required',
    (v: string) => (v && v.length < 16) || 'Name must be less than 16 characters',
  ]

  const isConfirmed = createConfirm({
    title: 'Update gateway name',
    contentComponent: VTextField,
    contentComponentProps: {
      'label': 'Name',
      'model-value': input,
      'rules': rules,
      'placeholder': config.value?.name,
      'ref': textField,
    },
    confirmationText: 'Save',
    dialogProps: {
      width: 600,
    },
  })

  textField.value?.focus()

  if (!await isConfirmed)
    return

  for (const rule of rules) {
    const result = rule(input.value ?? '')
    if (typeof result === 'string') {
      return toast('Error updating the gateway name.', {
        description: result,
        duration: 5000,
        cardProps: {
          color: 'error',
        },
      })
    }
  }

  if (input.value === config.value?.name)
    return

  await gateway.value?.updateConfig({
    name: input.value,
  })

  gatewayMachine.send({ type: 'REFRESH_CONFIG' })
}
</script>

<template>
  <portal to="before-content">
    <!--
    <v-navigation-drawer v-model="drawer" width="240" permanent>
      <v-toolbar height="48" :title="state.context.credentials.name" />
      <v-list lines="one">
        <template v-for="device, index in state.context.devices" :key="index">
          <list-item-device :device="device" />
        </template>

        <v-list-item
          v-for="item in state.context.devices"
          :key="item.title"
          :title="item.title"
          subtitle="..."
        />
      </v-list>
    </v-navigation-drawer>
    -->
  </portal>

  <v-card v-if="config" class="ma-2">
    <template #title>
      {{ config.name }}
      <v-btn icon="mdi-pencil" density="comfortable" @click="editName()" />
    </template>
    <template #subtitle>
      {{ config.bridgeid }}
    </template>
    <template #text>
      <pre>{{ { config } }}</pre>
      <!--
      <json-viewer :value="state.toStrings().pop()" />
      <json-viewer :value="state.context" />

      <v-btn :disabled="!state.can({type: 'Fix issue'})" @click="machine.send({type: 'Fix issue'})">
        Fix issue
      </v-btn>
      -->
      <!--
      <form-gateway-credentials :gateway="gateway" />
      -->

      <!--
      <json-viewer :value="state.context" />

      <v-btn v-if="state.can({type: 'Fix issue'})" @click="gateway.machine.send({type: 'Fix issue'})">
        Fix issue
      </v-btn>

      <p>Is offline : {{ state.matches("offline") }}</p>
      -->
    </template>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
