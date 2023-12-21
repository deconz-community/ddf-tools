<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { useConfirm } from 'vuetify-use-dialog'
import { VTextarea } from 'vuetify/components'
import { toast } from 'vuetify-sonner'
import { listBundles, readBundles, readDdfUuids } from '~/interfaces/store'

const props = defineProps<{
  bundle: string
}>()

const store = useStore()
const createConfirm = useConfirm()

const activeTab = useRouteQuery('activeTab', 'readme')

const isReady = computed(() => store.state?.matches('online') === true)

const bundle = store.request(computed(() => readBundles(props.bundle, {
  fields: [
    'id',
    'ddf_uuid',
    'product',
    'version_deconz',
    'date_created',
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

const ddfUuidInfo = store.request(computed(() => {
  if (!bundle.state.value || typeof bundle.state.value.ddf_uuid !== 'string')
    return undefined

  return readDdfUuids(bundle.state.value.ddf_uuid, {
    fields: [
      'deprecation_message',
      'user_created',
      {
        maintainers: ['user'],
      },
    ],
  })
}))

const otherVersions = store.request(computed(() => {
  if (!bundle.state.value || typeof bundle.state.value.ddf_uuid !== 'string')
    return undefined

  return listBundles({
    fields: [
      'id',
      'version_deconz',
      'date_created',
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
    sort: ['-date_created'],
  })
}))

const downloadURL = computed(() => {
  if (!isReady.value || !store.client)
    return undefined

  return `${store.client.url}bundle/download/${props.bundle}`
})

const settingsProps = computed(() => {
  if (!store.profile?.can_sign_with_system_keys)
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

  let state: keyof typeof settingsMap = 'alpha'

  if (bundle.state.value.signatures.some(s => s.key === settings.public_key_beta))
    state = 'beta'

  if (bundle.state.value.signatures.some(s => s.key === settings.public_key_stable))
    state = 'stable'

  return settingsMap[state]
})

const newState = ref('alpha')
watch(settingsProps, () => {
  newState.value = settingsProps.value?.state.toLocaleLowerCase() ?? 'alpha'
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
    const result = await store.client?.request<{
      success: boolean
      type: 'system'
      state: 'alpha' | 'beta' | 'stable'
    }>(() => ({
      method: 'POST',
      path: `/bundle/sign/${bundle.state.value?.id}`,
      params: {
        type: 'system',
        state: newState.value.toLocaleLowerCase(),
      },
    }))
    if (result && result.success)
      await bundle.execute()
  }
  catch (error) {
    if (Array.isArray(error.errors)) {
      error.errors.forEach((error: any) => {
        toast(`Error`, {
          description: error.message,
          duration: 5000,
          cardProps: {
            color: 'error',
          },
        })
      })
    }
  }
  finally {
    updatingState.value = false
  }
}

const deprecation_message = computed(() => {
  if (ddfUuidInfo.state.value && ddfUuidInfo.state.value.deprecation_message) {
    return {
      title: 'This bundle is deprecated',
      text: ddfUuidInfo.state.value.deprecation_message,
    }
  }

  else if (bundle.state.value && bundle.state.value.deprecation_message) {
    return {
      title: 'This version is deprecated',
      text: bundle.state.value.deprecation_message,
    }
  }

  else { return undefined }
})

async function deprecate(type: 'bundle' | 'version') {
  const input = ref('')

  const rules = [
    (v: string) => !!v || 'Message is required',
    (v: string) => (v && v.length >= 10) || 'Message must be more than 10 characters',
  ]

  const isConfirmed = await createConfirm({
    title: `This will mark this ${type} as deprecated`,
    contentComponent: VTextarea,
    contentComponentProps: {
      'label': 'Deprecation message',
      'model-value': input,
      'rules': rules,
      'placeholder': `Don't use this ${type} anymore because...`,
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

  if (!isConfirmed)
    return

  for (const rule of rules) {
    const result = rule(input.value)
    if (typeof result === 'string') {
      return toast(`Error while deprecating this ${type}.`, {
        description: result,
        duration: 5000,
        cardProps: {
          color: 'error',
        },
      })
    }
  }

  try {
    const params: Record<string, any> = {
      type,
      message: input.value,
      ddf_uuid: bundle.state.value?.ddf_uuid,
    }

    if (type === 'version')
      params.bundle_id = bundle.state.value?.id

    const result = await store.client?.request<{
      success: boolean
      type: 'system'
      state: 'alpha' | 'beta' | 'stable'
    }>(() => ({
      method: 'POST',
      path: `/bundle/deprecate`,
      params,
    }))
    if (result && result.success) {
      await bundle.execute()
      toast(`Deprecation message updated`, {
        duration: 5000,
        cardProps: {
          color: 'success',
        },
      })
    }
  }
  catch (error) {
    if (Array.isArray(error.errors)) {
      error.errors.forEach((error: any) => {
        toast(`Error`, {
          description: error.message,
          duration: 5000,
          cardProps: {
            color: 'error',
          },
        })
      })
    }
  }
}

async function reinstate(type: 'bundle' | 'version') {
  try {
    const params: Record<string, any> = {
      type,
      message: 'null',
      ddf_uuid: bundle.state.value?.ddf_uuid,
    }

    if (type === 'version')
      params.bundle_id = bundle.state.value?.id

    const result = await store.client?.request<{
      success: boolean
      type: 'system'
      state: 'alpha' | 'beta' | 'stable'
    }>(() => ({
      method: 'POST',
      path: `/bundle/deprecate`,
      params,
    }))
    if (result && result.success) {
      await bundle.execute()
      toast(`Deprecation message updated`, {
        duration: 5000,
        cardProps: {
          color: 'success',
        },
      })
    }
  }
  catch (error) {
    if (Array.isArray(error.errors)) {
      error.errors.forEach((error: any) => {
        toast(`Error`, {
          description: error.message,
          duration: 5000,
          cardProps: {
            color: 'error',
          },
        })
      })
    }
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
      <chip-signatures v-else :signatures="bundle.state.value.signatures" only="system" class="ma-2" />
      <v-chip class="ma-2" color="grey">
        {{ bundle.state.value.id.substring(bundle.state.value.id.length - 10) }}
      </v-chip>
    </v-card-title>

    <v-card-subtitle>
      Published {{ useTimeAgo(bundle.state.value.date_created).value }}
    </v-card-subtitle>

    <v-card-text>
      <v-tabs
        v-model="activeTab"
        bg-color="primary"
      >
        <v-tab value="readme">
          Readme
        </v-tab>
        <v-tab value="code">
          Code
        </v-tab>
        <v-tab value="versions">
          {{ otherVersions.state.value?.length || 0 }} Versions
        </v-tab>
        <v-tab v-if="settingsProps" value="settings">
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

            <v-window-item value="code">
              <pre class="ma-2">{{ {
                bundle: bundle.state.value,
                otherVersions: otherVersions.state.value,
              } }}</pre>
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
                    <td>{{ useTimeAgo(version.date_created).value }}</td>
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
                <!--
                <v-card-actions>
                  <template v-for="newState in settingsProps.down" :key="newState">
                    <v-btn
                      :disabled="signing"
                      color="orange"
                      prepend-icon="mdi-tag-arrow-down-outline"
                      @click="sign(newState)"
                    >
                      Demote to {{ newState }}
                    </v-btn>
                  </template>
                  <template v-for="newState in settingsProps.up" :key="newState">
                    <v-btn
                      :disabled="signing"
                      color="green"
                      prepend-icon="mdi-tag-arrow-up-outline"
                      @click="sign(newState)"
                    >
                      Promote to {{ newState }}
                    </v-btn>
                  </template>
                </v-card-actions>
                -->
              </v-card>
              <v-card class="ma-2" title="Maintainers">
                <v-card-text>
                  Foo
                </v-card-text>
                <v-card-actions>
                  <v-btn color="primary" prepend-icon="mdi-account-plus">
                    Invite maintainer (TODO)
                  </v-btn>
                </v-card-actions>
              </v-card>
              <v-card v-if="!bundle.state.value?.deprecation_message" class="ma-2" title="Deprecate version">
                <v-card-text>
                  This will mark this version of the bundle as deprecated.
                  <v-spacer />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn color="orange" prepend-icon="mdi-flag" @click="deprecate('version')">
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
                  <v-btn color="orange" prepend-icon="mdi-flag" @click="reinstate('version')">
                    Reinstate this version
                  </v-btn>
                </v-card-actions>
              </v-card>
              <v-card v-if="!ddfUuidInfo.state.value?.deprecation_message" class="ma-2" title="Deprecate bundle">
                <v-card-text>
                  This will mark all versions of the bundle as deprecated.
                  <v-spacer />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn color="red" prepend-icon="mdi-flag" @click="deprecate('bundle')">
                    Deprecate all versions
                  </v-btn>
                </v-card-actions>
              </v-card>
              <v-card v-else class="ma-2" title="Reinstate bundle">
                <v-card-text>
                  This will reinstate all versions of the bundle.
                  <v-spacer />
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn color="orange" prepend-icon="mdi-flag" @click="reinstate('bundle')">
                    Reinstate all version
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-window-item>
          </v-window>
        </v-sheet>

        <v-sheet class="ma-2 pa-2" width="30%">
          <v-btn
            block
            color="primary"
            prepend-icon="mdi-download"
            class="mb-2"
            disabled
          >
            Install (TODO)
          </v-btn>
          <v-btn
            block color="primary"
            prepend-icon="mdi-download"
            :disabled="!downloadURL"
            :href="downloadURL"
          >
            Download
          </v-btn>
          <v-list class="d-flex flex-column">
            <v-list-item title="Hash">
              <v-chip class="ma-2" color="grey">
                {{ bundle.state.value.id.substring(bundle.state.value.id.length - 10) }}
              </v-chip>
            </v-list-item>
            <v-list-item title="Published">
              {{ useTimeAgo(bundle.state.value.date_created).value }}
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
            <v-list-item title="Maintainers">
              TODO
            </v-list-item>
            <v-list-item title="Signed by">
              <chip-signatures :signatures="bundle.state.value.signatures" only="user" class="mr-4 ma-2" size="large" />
            </v-list-item>
          </v-list>
          <v-btn color="red" prepend-icon="mdi-flag" class="w-100">
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
