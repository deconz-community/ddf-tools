<script setup lang="ts">
import type { ExtractResponseSchemaForAlias } from '@deconz-community/rest-client'

const props = defineProps<{
  ddfPolicy: ExtractResponseSchemaForAlias<'getDevice'>['ddf_policy']
  ddfHash?: string
  gateway: string
  deviceId: string
  deviceName: string
  manufacturerName: string
  modelId: string
}>()

const attrs = {
  latest_prefer_stable: {
    value: 'latest_prefer_stable',
    title: 'Latest stable (Default)',
    icon: 'mdi-cursor-default',
    chip: {
      text: 'Latest stable',
      color: 'green',
    },
  },
  latest: {
    value: 'latest',
    title: 'Latest',
    icon: 'mdi-history',
    chip: {
      text: 'Latest',
      color: 'orange',
    },
  },
  pin: {
    value: 'pin',
    title: 'Pinned',
    icon: 'mdi-pin-outline',
    chip: {
      text: 'Pinned',
      color: 'primary',
    },
  },
  raw_json: {
    value: 'raw_json',
    title: 'Raw JSON',
    icon: 'mdi-code-json',
    chip: {
      text: 'Raw JSON',
      color: 'secondary',
    },
  },
} as const

const gateway = useGateway(toRef(props, 'gateway'))
const bundleSearch = ref('')
const isActive = ref(false)

const { cloned: policy, sync: syncPolicy } = useCloned(toRef(props, 'ddfPolicy'))
const { cloned: hash, sync: syncHash } = useCloned(toRef(props, 'ddfHash'))

const avaliableBundles = computed(() => {
  return Array.from(gateway.bundles.entries())
    .filter(([_hash, bundle]) => bundle.device_identifiers.some(
      ([ma, mo]) => props.manufacturerName === ma && props.modelId === mo,
    ))
    .map(([hash, bundle]) => ({
      ...bundle,
      hash,
      last_modified: new Date(bundle.last_modified),
    }))
    .sort((a, b) => b.last_modified.getTime() - a.last_modified.getTime())
})

async function save() {
  if (!policy.value) {
    toast.error('Please select a policy')
    return
  }

  const results = await gateway.fetch('setDeviceDDFPolicy', {
    deviceUniqueID: props.deviceId,
    body: {
      policy: policy.value,
      hash: hash.value,
    },
  })

  results.forEach((result) => {
    if (result.isErr()) {
      toast.error('Failed to set DDF policy')
    }
    else {
      isActive.value = false
      gateway.send({ type: 'REFRESH_DEVICES' })
      toast.success('Successfully set DDF policy')
    }
  })
}
</script>

<template>
  <v-dialog
    v-if="props.ddfPolicy"
    v-model="isActive"
    max-width="800"
    @after-leave="syncHash(); syncPolicy()"
  >
    <template #activator="{ props: activatorProps }">
      <v-chip
        v-bind="{
          ...attrs[props.ddfPolicy].chip,
          ...activatorProps,
        }"
        append-icon="mdi-pencil"
        class="ma-2"
      />
    </template>

    <template #default="">
      <v-card>
        <v-card-title>
          Edit DDF Policy for {{ props.deviceName }}
        </v-card-title>
        <v-card-text>
          <v-btn-toggle
            v-model="policy"
            variant="outlined"
            color="primary"
            mandatory
            block
            class="ma-2"
          >
            <v-btn
              v-for="attr of Object.values(attrs)" :key="attr.value"
              :value="attr.value"
              :text="attr.title"
              :append-icon="attr.icon"
              :color="attr.chip.color"
            />
          </v-btn-toggle>

          <v-text-field
            v-model="bundleSearch"
            class="ma-2"
            placeholder="Search"
            append-inner-icon="mdi-close"
            label="Search DDF bundle"
            single-line
            hide-details
            @click:append-inner="bundleSearch = ''"
          />

          <v-data-table
            :search="bundleSearch"
            :headers="[{
              title: 'Hash',
              key: 'hash',
            }, {
              title: 'Product',
              key: 'product',
            }, {
              title: 'Version deCONZ',
              key: 'version_deconz',
            }, {
              title: 'Last Modified',
              key: 'last_modified',
            }, {
              title: 'Select',
              key: 'select',
            }]"
            :sort-by="[{
              key: 'last_modified',
              order: 'desc',
            }]"
            :items="avaliableBundles"
            item-value="hash"
          >
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.hash="{ item }">
              <chip-ddf-hash
                :hash="item.hash"
                :gateway="props.gateway"
              />
            </template>

            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.last_modified="{ item }">
              <v-tooltip :text="`${item.last_modified.toLocaleDateString()} ${item.last_modified.toLocaleTimeString()}`">
                <template #activator="{ props: localProps }">
                  <p v-bind="localProps">
                    <UseTimeAgo v-slot="{ timeAgo }" :time="item.last_modified">
                      {{ timeAgo }}
                    </UseTimeAgo>
                  </p>
                </template>
              </v-tooltip>
            </template>

            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.select="{ item }">
              <v-btn
                color="primary"
                width="90"
                :text="policy === 'pin' && item.hash === hash ? 'Selected' : 'Select'"
                :disabled="policy === 'pin' && item.hash === hash"
                @click="hash = item.hash; policy = 'pin'"
              />
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn
            text="Save"
            color="success"
            append-icon="mdi-floppy"
            variant="elevated"
            @click="save();"
          />
          <v-btn
            text="Close Dialog"
            color="secondary"
            append-icon="mdi-close"
            variant="elevated"
            @click="isActive = false"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>

  <v-chip v-else class="ma-2" color="warning">
    None
  </v-chip>
</template>
