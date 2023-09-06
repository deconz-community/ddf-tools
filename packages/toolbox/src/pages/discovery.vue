<script setup lang="ts">
import type { DiscoveryResult } from '~/machines/discovery'

// const discovery = useActor(computed(() => app.service.children.get('discovery')!))
// const sampleCreds = JSON.parse(import.meta.env.VITE_GATEWAY_CREDENTIALS)

// console.log(sampleCreds)
const app = useAppMachine('app')

const discovery = useAppMachine('discovery')

const resultsList = computed(() => {
  return discovery.state.value ? Array.from(discovery.state.value.context.results.values()) : []
})

async function test() {

}

function addGateway() {
  if (resultsList.value.length > 0) {
    const result = resultsList.value[0]
    app.send({
      type: 'Add gateway',
      credentials: {
        apiKey: '',
        id: result.id,
        name: result.name,
        URIs: {
          api: result.uri,
          websocket: [],
        },
      },
    })
  }
}

function scan() {
  discovery.send({
    type: 'Start scan',
    uri: 'http://localhost',
  })
}

onMounted(() => {
  console.log('Start scan')
  discovery.send({ type: 'Start scan' })
  console.log('End scan')
})

const editingData = ref<undefined | DiscoveryResult>(discovery.state.value?.context.editing)
watch(toRef(() => discovery.state.value?.context.editing), (newValue) => {
  editingData.value = structuredClone(newValue)
})
</script>

<template>
  Discovery
  <v-btn @click="test()">
    Test
  </v-btn>
  <v-btn @click="addGateway()">
    add Gateway
  </v-btn>
  <v-btn v-if="discovery.state.value" :disabled="!discovery.state.value.can('Start scan')" @click="scan()">
    Scan
  </v-btn>

  <!--
  <pre>{{ discovery.state.value?.value }}</pre>

  <pre>{{ JSON.stringify(resultsList, null, 2) }}</pre>

  {{ editingData }}
  -->

  <template v-if="discovery.state.value">
    <v-card
      v-for="result in discovery.state.value.context.results.values()" :key="result.id"
      class="ma-3"
    >
      <v-card-item>
        <v-card-title>
          {{ result.name }}
          <v-chip class="ml-2">
            {{ result.version }}
          </v-chip>
        </v-card-title>
        <v-card-subtitle>{{ result.id }}</v-card-subtitle>
      </v-card-item>
    </v-card>
  </template>

  <!--
  <json-viewer
    v-if="discovery.state.value"
    :value="discovery.state.value.value"
    :expand-depth="5"
  />
  -->

  <!--
  <json-viewer v-if="gateway.state.value" :value="gateway.state.value.value" :expand-depth="5" />
  -->
</template>

<route lang="json">
{
  "meta": {
    "breadcrumbs": "none",
    "hideLevelTwoSidebar": true
  }
}
</route>
