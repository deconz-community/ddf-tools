<script setup lang="ts">
import { objectEntries } from 'ts-extras'

import { UseTimeAgo } from '@vueuse/components'

const props = defineProps<{
  gateway: string
}>()

const gateway = useAppMachine('gateway', computed(() => ({ id: props.gateway })))
const search = ref('')

const { state, isLoading, execute } = useAsyncState(async () => {
  if (!gateway.state?.matches('online'))
    return []

  const client = gateway.state.context.gateway
  if (!client)
    return []

  const config = await client.getConfig()

  if (config.success === undefined || !('whitelist' in config.success))
    return []

  // TODO disable if deleting used key / or add warning
  return objectEntries(config.success.whitelist).map(([key, value]) => ({
    key,
    name: value.name,
    created: value['create date'],
    lastUsed: value['last use date'],
  }))
}, [])

watch(() => gateway.state, () => execute())

async function deleteKey(key: string) {
  if (!gateway.state?.matches('online'))
    return

  const client = gateway.state.context.gateway
  if (!client)
    return

  await client.deleteAPIKey(undefined, {
    params: {
      oldApiKey: key,
    },
  })

  // Workaround for https://github.com/dresden-elektronik/deconz-rest-plugin/issues/7216
  await client.updateConfig({
    unlock: 1,
  })

  execute()
}
</script>

<template>
  <v-card class="ma-3">
    <v-card-title>
      Manage API Keys

      <v-btn @click="execute()">
        Refresh
      </v-btn>
      <v-spacer />
      <v-text-field
        v-model="search"
        placeholder="Search"
        append-inner-icon="mdi-close"
        label="Search"
        single-line
        hide-details
        @click:append-inner="search = ''"
      />
    </v-card-title>
    <v-card-text>
      <v-data-table
        :loading="isLoading"
        :search="search"
        :headers="[{
          title: 'Key',
          key: 'key',
        }, {
          title: 'Name',
          key: 'name',
        }, {
          title: 'Created',
          key: 'created',
        }, {
          title: 'Last Used',
          key: 'lastUsed',
        }, {
          title: 'Actions',
          key: 'actions',
        }]"
        :sort-by="[{
          key: 'created',
          order: 'desc',
        }]"
        :items="state"
        item-value="key"
      >
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.created="{ item }">
          <v-tooltip :text="`${item.columns.created.toLocaleDateString()} ${item.columns.created.toLocaleTimeString()}`">
            <template #activator="{ props: localProps }">
              <p v-bind="localProps">
                <UseTimeAgo v-slot="{ timeAgo }" :time="item.columns.created">
                  {{ timeAgo }}
                </UseTimeAgo>
              </p>
            </template>
          </v-tooltip>
        </template>
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.lastUsed="{ item }">
          <v-tooltip :text="`${item.columns.lastUsed.toLocaleDateString()} ${item.columns.lastUsed.toLocaleTimeString()}`">
            <template #activator="{ props: localProps }">
              <p v-bind="localProps">
                <UseTimeAgo v-slot="{ timeAgo }" :time="item.columns.lastUsed">
                  {{ timeAgo }}
                </UseTimeAgo>
              </p>
            </template>
          </v-tooltip>
        </template>
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.actions="{ item }">
          <v-btn icon="mdi-delete" size="small" color="error" @click="deleteKey(item.columns.key)" />
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>