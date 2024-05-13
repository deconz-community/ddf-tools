<script setup lang="ts">
import { produce } from 'immer'
import { objectEntries } from 'ts-extras'

const props = defineProps<{
  gateway: string
}>()

const gateway = useGateway(toRef(props, 'gateway'))

const search = ref('')

const keys = computed(() => {
  if (!gateway.config || !('whitelist' in gateway.config))
    return []
  return objectEntries(gateway.config.whitelist).map(([key, value]) => ({
    key,
    name: value.name,
    created: value['create date'],
    lastUsed: value['last use date'],
  }))
})

async function deleteKey(key: string) {
  if (!gateway.state?.matches('online'))
    return

  const results = await gateway.fetch('deleteAPIKey', { oldApiKey: key })
  results.forEach((result) => {
    if (result.isErr())
      toast.error(result.error.message)
    else
      toast.success('API Key deleted')
  })

  if (gateway.credentials && gateway.credentials?.apiKey === key) {
    gateway.send({
      type: 'UPDATE_CREDENTIALS',
      data: produce(gateway.credentials, (draft) => {
        draft.apiKey = ''
      }),
    })
    return
  }

  gateway.send({ type: 'REFRESH_CONFIG' })
}

const isLoading = refDebounced(
  computed(() => !gateway.state?.matches({ online: { config: 'idle' } })),
  50,
)
</script>

<template>
  <v-card class="ma-2">
    <v-card-title>
      Manage API Keys
      <v-btn
        class="ma-2"
        :disabled="!gateway.state?.can({ type: 'REFRESH_CONFIG' })"
        @click="gateway.send({ type: 'REFRESH_CONFIG' })"
      >
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
        :items="keys"
        item-value="key"
      >
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.created="{ item }">
          <v-tooltip :text="`${item.created.toLocaleDateString()} ${item.created.toLocaleTimeString()}`">
            <template #activator="{ props: localProps }">
              <p v-bind="localProps">
                <UseTimeAgo v-slot="{ timeAgo }" :time="item.created">
                  {{ timeAgo }}
                </UseTimeAgo>
              </p>
            </template>
          </v-tooltip>
        </template>
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.lastUsed="{ item }">
          <v-tooltip :text="`${item.lastUsed.toLocaleDateString()} ${item.lastUsed.toLocaleTimeString()}`">
            <template #activator="{ props: localProps }">
              <p v-bind="localProps">
                <UseTimeAgo v-slot="{ timeAgo }" :time="item.lastUsed">
                  {{ timeAgo }}
                </UseTimeAgo>
              </p>
            </template>
          </v-tooltip>
        </template>
        <!-- eslint-disable-next-line vue/valid-v-slot -->
        <template #item.actions="{ item }">
          <v-btn icon="mdi-delete" size="small" color="error" @click="deleteKey(item.key)" />
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>
