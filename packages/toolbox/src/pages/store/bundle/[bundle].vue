<script setup lang="ts">
import { decode } from '@deconz-community/ddf-bundler'
import { useTimeAgo } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { useConfirm } from 'vuetify-use-dialog'
import { VTextarea } from 'vuetify/components'
import type { BundleDeprecateParams, BundleSignatureState } from '~/composables/useStore'
import { listBundles, readBundles, readDdfUuids } from '~/interfaces/store'
import { toastError } from '~/lib/handleError'

const props = defineProps<{
  bundle: string
}>()

const app = useApp()
const store = useStore()
const createConfirm = useConfirm()

const activeTab = useRouteQuery('activeTab', 'readme')
const activeGatewayId = useRouteQuery<string>('gatewayID', '')
const activeGateway = useGateway(activeGatewayId)

const isDev = app.select(state => state.context.settings?.developerMode)
const isReady = store.select(state => state.matches('online') === true)

const bundle = store.request(computed(() => readBundles(props.bundle, {
  fields: [
    'id',
    'ddf_uuid',
    'product',
    'version_deconz',
    'source_last_modified',
    'content_size',
    'file_count',
    'deprecation_message',
    {
      device_identifiers: [
        {
          device_identifiers_id: [
            'manufacturer',
            'model',
          ],
        },
      ],
    },
    {
      signatures: [
        'key',
        'type',
      ],
    },
  ],
})))

const otherVersions = store.request(computed(() => {
  if (!bundle.state.value || typeof bundle.state.value.ddf_uuid !== 'string')
    return undefined

  return listBundles({
    fields: [
      'id',
      'version_deconz',
      'source_last_modified',
      'deprecation_message',
      {
        signatures: [
          'key',
          'type',
        ],
      },
    ],
    filter: {
      ddf_uuid: {
        _eq: bundle.state.value.ddf_uuid,
      },
    },
    sort: ['-source_last_modified'],
  })
}))

const downloadURL = computed(() => {
  if (!isReady.value || !store.client)
    return undefined

  return `${store.client.url}bundle/download/${props.bundle}`
})

const settingsProps = computed(() => {
  if (!store.profile?.is_contributor)
    return undefined

  if (!bundle.state.value)
    return undefined

  const settings = store.state?.context?.settings

  if (!settings)
    return undefined

  const settingsMap = {
    alpha: {
      state: 'Alpha',
      down: [],
      up: ['beta', 'stable'],
    },
    beta: {
      state: 'Beta',
      down: ['alpha'],
      up: ['stable'],
    },
    stable: {
      state: 'Stable',
      down: ['alpha', 'beta'],
      up: [],
    },
  } as const

  if (bundle.state.value.signatures === null)
    return settingsMap.alpha

  if (bundle.state.value.signatures.some(s => s.key === settings.public_key_beta))
    return settingsMap.beta

  if (bundle.state.value.signatures.some(s => s.key === settings.public_key_stable))
    return settingsMap.stable

  return settingsMap.alpha
})

const newState = ref<BundleSignatureState>('alpha')
watch(settingsProps, () => {
  newState.value = settingsProps.value?.state.toLocaleLowerCase() as BundleSignatureState ?? 'alpha'
})
const updatingState = ref(false)
async function updateState() {
  if (!['alpha', 'beta', 'stable'].includes(newState.value))
    return

  if (updatingState.value === true)
    return

  if (settingsProps.value?.state.toLocaleLowerCase() === newState.value)
    return

  updatingState.value = true

  try {
    const bundleID = bundle.state.value?.id
    if (!bundleID)
      throw new Error('No bundle ID')

    const result = await store.client?.request(
      storeSignBundle(bundleID, newState.value.toLocaleLowerCase() as BundleSignatureState),
    )

    if (result && result.success) {
      await bundle.execute()
      toast.success(`Bundle state updated to ${newState.value}`)
    }
  }
  catch (error) {
    toastError(error)
  }
  finally {
    updatingState.value = false
  }
}

const deprecation_message = computed(() => {
  if (bundle.state.value && bundle.state.value.deprecation_message) {
    return {
      title: 'This version is deprecated',
      text: bundle.state.value.deprecation_message,
    }
  }

  else { return undefined }
})

async function deprecate() {
  const input = ref('')
  const textArea = ref<VTextarea>()

  const rules = [
    (v: string) => !!v || 'Message is required',
    (v: string) => (v && v.length >= 10) || 'Message must be more than 10 characters',
  ]

  const isConfirmed = createConfirm({
    title: `This will mark this version as deprecated`,
    contentComponent: VTextarea,
    contentComponentProps: {
      'label': 'Deprecation message',
      'model-value': input,
      'rules': rules,
      'placeholder': `Don't use this version anymore because...`,
      'ref': textArea,
    },
    confirmationText: 'Deprecate',
    confirmationButtonProps: {
      // TODO disable this button until the input is valid
      color: 'red',
    },
    dialogProps: {
      width: 600,
    },
  })

  textArea.value?.focus()

  if (!await isConfirmed)
    return

  for (const rule of rules) {
    const result = rule(input.value)
    if (typeof result === 'string')
      return toast.error(`Error while deprecating this bundle.`)
  }

  try {
    if (bundle.state.value === null)
      throw new Error('No bundle')

    const result = await store.client?.request(storeDeprecateBundle({
      type: 'version',
      message: input.value,
      bundle_id: bundle.state.value.id,
    }))

    if (result && result.success) {
      await bundle.execute()
      toast.success(`Deprecation message updated`)
    }
  }
  catch (error) {
    toastError(error)
  }
}

async function reinstate() {
  try {
    if (bundle.state.value === null)
      throw new Error('No bundle')

    const result = await store.client?.request(storeDeprecateBundle({
      type: 'version',
      message: 'null',
      bundle_id: bundle.state.value.id,
    }))

    if (result && result.success) {
      await bundle.execute()
      toast.success(`Deprecation message updated`)
    }
  }
  catch (error) {
    toastError(error)
  }
}

async function installBundle() {
  if (!activeGatewayId.value)
    return

  try {
    const bundle = await store.client?.request(storeDownloadBundle(props.bundle))

    if (!bundle || !bundle.success)
      return toast.error(`Error while downloading bundle from the store`)

    const uploadResult = await activeGateway.fetch('uploadDDFBundle', {
      body: new File([bundle.success], 'bundle.ddf', {
        type: 'application/x-deconz-ddf-bundle',
      }),
    })

    uploadResult.forEach((result) => {
      if (result.isOk())
        toast.success(`Bundle uploaded to ${activeGateway.config?.name}`)
      else
        toast.error(`Error while uploading bundle to ${activeGateway.config?.name}`)
    })
  }
  catch (error) {
    toastError(error)
  }
}
</script>

<template>
  <v-card v-if="bundle.state.value" class="ma-2">
    <v-card-title>
      {{ bundle.state.value.product }}
      <v-chip v-if="deprecation_message" variant="flat" color="orange">
        Deprecated
      </v-chip>
      <chip-signatures v-else-if="bundle.state.value.signatures" :signatures="bundle.state.value.signatures" only="system" class="ma-2" />
      <v-chip class="ma-2" color="grey">
        {{ bundle.state.value.id.substring(bundle.state.value.id.length - 10) }}
      </v-chip>
    </v-card-title>

    <v-card-subtitle>
      Published {{ useTimeAgo(bundle.state.value.source_last_modified).value }}
    </v-card-subtitle>

    <v-card-text>
      <v-tabs
        v-model="activeTab"
        bg-color="primary"
      >
        <v-tab value="readme">
          <v-icon icon="mdi-book-open-outline" class="mr-2" />
          Readme
        </v-tab>
        <v-tab value="versions">
          <v-icon icon="mdi-tag-multiple" class="mr-2" />
          {{ otherVersions.state.value?.length || 0 }} Versions
        </v-tab>
        <v-tab v-if="settingsProps" value="settings">
          <v-icon icon="mdi-cog" class="mr-2" />
          Settings
        </v-tab>
      </v-tabs>

      <v-sheet class="d-flex bg-surface-variant">
        <v-sheet class="flex-grow-1 ma-2 pa-2">
          <v-window v-model="activeTab">
            <v-window-item value="readme">
              <v-alert
                v-show="deprecation_message"
                v-bind="deprecation_message"
                icon="mdi-alert"
                type="warning"
              />

              <v-card elevation="2" class="ma-2">
                <template #title>
                  Supported devices
                </template>
                <template #text>
                  <v-table>
                    <thead>
                      <tr>
                        <th class="text-left">
                          Manufacturer
                        </th>
                        <th class="text-left">
                          Model
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="item in bundle.state.value.device_identifiers"
                        :key="item.device_identifiers_id.id"
                      >
                        <td>{{ item.device_identifiers_id.manufacturer }}</td>
                        <td>{{ item.device_identifiers_id.model }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </template>
              </v-card>
            </v-window-item>

            <v-window-item value="versions">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-left">
                      Hash
                    </th>
                    <th class="text-left">
                      Tag
                    </th>
                    <th class="text-left">
                      Version Deconz
                    </th>
                    <th class="text-left">
                      Published
                    </th>
                    <th class="text-left">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="version in otherVersions.state.value"
                    :key="version.id"
                  >
                    <td>
                      <v-chip class="ml-2" color="grey">
                        {{ version.id.substring(version.id.length - 10) }}
                      </v-chip>
                    </td>
                    <td>
                      <v-chip v-if="version.deprecation_message" variant="flat" color="orange">
                        Deprecated
                      </v-chip>
                      <chip-signatures v-else :signatures="version.signatures ?? []" only="system" class="ma-2" />
                    </td>
                    <td>{{ version.version_deconz }}</td>
                    <td>{{ useTimeAgo(version.source_last_modified).value }}</td>
                    <td>
                      <v-btn :to="`/store/bundle/${version.id}`">
                        Open
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-window-item>

            <v-window-item v-if="settingsProps" value="settings">
              <v-card class="ma-2" title="Lifecycle">
                <v-card-text>
                  Current state : {{ settingsProps.state }}
                </v-card-text>

                <v-card-actions>
                  <v-btn-toggle
                    v-model="newState"
                    mandatory
                    divided
                    variant="outlined"
                    @click="updateState()"
                  >
                    <v-btn
                      value="alpha"
                      prepend-icon="mdi-tag-outline"
                      text="Alpha"
                      color="red"
                      :width="100"
                    />
                    <v-btn
                      value="beta"
                      prepend-icon="mdi-tag-outline"
                      text="Beta"
                      color="orange"
                      :width="100"
                    />
                    <v-btn
                      value="stable"
                      prepend-icon="mdi-tag-outline"
                      text="Stable"
                      color="green"
                      :width="100"
                    />
                  </v-btn-toggle>
                </v-card-actions>
              </v-card>
              <v-card v-if="!bundle.state.value?.deprecation_message" class="ma-2" title="Deprecate bundle version">
                <v-card-text>
                  This will mark this version of the bundle as deprecated.
                  <v-spacer />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn color="orange" prepend-icon="mdi-flag" @click="deprecate()">
                    Deprecate this version
                  </v-btn>
                </v-card-actions>
              </v-card>
              <v-card v-else class="ma-2" title="Reinstate version">
                <v-card-text>
                  This will reinstate this version of the bundle.
                  <v-spacer />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn color="orange" prepend-icon="mdi-flag" @click="reinstate()">
                    Reinstate this version
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-window-item>
          </v-window>
        </v-sheet>

        <v-sheet class="ma-2 pa-2" width="30%">
          <v-list class="d-flex flex-column">
            <v-list-item title="Install">
              <v-menu transition="slide-y-transition">
                <template #activator="{ props: menuProps }">
                  <v-btn-group class="d-flex">
                    <v-tooltip :text="`Install bundle on gateway ${activeGateway.config?.name}`">
                      <template #activator="{ props: tooltipProps }">
                        <v-btn
                          v-bind="tooltipProps"
                          color="primary"
                          icon="mdi-file-move-outline"
                          width="50"
                          class="mb-2"
                          comfortable
                          @click="installBundle()"
                        />
                      </template>
                    </v-tooltip>

                    <v-divider vertical :thickness="3" length="40" />
                    <v-btn
                      v-bind="menuProps"
                      color="primary"
                      class="mb-2 flex-grow-1"
                      append-icon="mdi-chevron-down"
                      comfortable
                      :text="activeGateway.config?.name ?? 'Select gateway'"
                    />
                  </v-btn-group>
                </template>
                <v-list>
                  <v-list-item
                    v-for="(item, i) in app.gatewayIds"
                    :key="i"
                    @click="activeGatewayId = item"
                  >
                    <v-list-item-title>
                      {{ item }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-btn
                block color="primary"
                prepend-icon="mdi-download"
                :disabled="!downloadURL"
                :href="downloadURL"
              >
                Download
              </v-btn>
            </v-list-item>

            <v-list-item title="Hash">
              <v-chip class="ma-2" color="grey">
                {{ bundle.state.value.id.substring(bundle.state.value.id.length - 10) }}
              </v-chip>
            </v-list-item>
            <v-list-item title="Published">
              {{ useTimeAgo(bundle.state.value.source_last_modified).value }}
            </v-list-item>
            <v-list-item title="Version deconz">
              {{ bundle.state.value.version_deconz }}
            </v-list-item>
            <v-list-item title="Supported devices">
              {{ bundle.state.value.device_identifiers.length }}
            </v-list-item>
            <v-list-item title="Bundle Size">
              {{ bundle.state.value.content_size ?? 'Unknown' }}
            </v-list-item>
            <v-list-item title="Total Files">
              {{ bundle.state.value.file_count ?? 'Unknown' }}
            </v-list-item>
            <v-list-item title="Signed by">
              <chip-signatures :signatures="bundle.state.value.signatures" only="user" class="mr-4 ma-2" size="large" />
            </v-list-item>
          </v-list>
          <v-btn
            v-if="isDev"
            color="red"
            prepend-icon="mdi-flag"
            class="w-100"
          >
            Report (TODO)
          </v-btn>
        </v-sheet>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "breadcrumbs": "none",
    "hideLevelTwoSidebar": true
  }
}
</route>
