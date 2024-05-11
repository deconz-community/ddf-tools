<script setup lang="ts">
const props = defineProps<{
  gateway: string
}>()

const gateway = useGateway(toRef(props, 'gateway'))

const permitJoin = computed(() =>
  gateway.config && 'permitjoin' in gateway.config
    ? gateway.config.permitjoin
    : undefined,
)

const drawer = ref(false)
onMounted(() => setTimeout(() => drawer.value = true, 0))

async function openGateway() {
  await gateway.fetch('findSensor', {})
  getResult()
  gateway.send({ type: 'REFRESH_CONFIG' })
}

const findResult = ref()

async function getResult() {
  const results = await gateway.fetch('getSensorFindResult', {})

  results.forEach((result) => {
    if (!result.isOk())
      return

    findResult.value = result.value
  })
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

  <v-card v-if="gateway.config" class="ma-2">
    <template #title>
      {{ gateway.config.name }}
      <v-btn icon="mdi-refresh" density="comfortable" @click="gateway.send({ type: 'REFRESH_CONFIG' })" />
    </template>
    <template #subtitle>
      {{ gateway.config.bridgeid }}
    </template>
    <template #text>
      <v-btn density="comfortable" text="Add sensor" @click="openGateway()" />
      <v-btn density="comfortable" text="Update find result" @click="getResult()" />
      <pre>{{ { permitJoin, findResult } }}</pre>
      <pre>{{ gateway.config }}</pre>
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
