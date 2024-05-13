<script setup lang="ts">
import type { EndpointAlias, RequestResultForAlias } from '@deconz-community/rest-client'
import { endpoints } from '@deconz-community/rest-client'
import { useRouteQuery } from '@vueuse/router'
import type { Component } from 'vue'
import { saveAs } from 'file-saver'
import { VTreeview } from 'vuetify/labs/VTreeview'
import { z } from 'zod'
import BtnGatewayDownloadBackup from '~/components/btn/btn-gateway-download-backup.vue'
import CardAuthChallenge from '~/components/card/card-auth-challenge.vue'

const props = defineProps<{
  gateway: string
}>()

const fancyUI = ref(true)

const queryAlias = useRouteQuery<string>('alias', 'discover')

const endpointAlias = computed({
  get() {
    const alias = queryAlias.value as keyof typeof endpoints
    if (typeof alias !== 'string' || !(alias in endpoints))
      return undefined

    return alias
  },
  set(newValue) {
    queryAlias.value = newValue as string
  },
})

// #region API Tree

interface APITree {
  alias?: string
  title: string
  subtitle?: string
  props?: Record<string, any>
  children?: APITree[]
}

const apiTree = computed<APITree[]>(() => {
  const tree: APITree[] = []
  Object.entries(endpoints).forEach(([alias, api]) => {
    const path = api.path.replace('/api/{:apiKey:}', '')
    const subtitle = `${api.method.toUpperCase()} ${path}`
    const leaf = tree.find(leaf => leaf.title === api.category)
    if (leaf) {
      if (!leaf.children)
        leaf.children = []
      leaf.children.push({
        alias,
        title: api.name,
        props: {
          subtitle,
        },
      })
    }
    else {
      tree.push({
        title: api.category,
        children: [{
          alias,
          title: api.name,
          props: {
            subtitle,
          },
        }],
      })
    }
  })
  return tree.sort((a, b) => a.title.localeCompare(b.title))
})

function selectAPI(params: unknown) {
  const alias = z.array(z.string())
    .length(1)
    .transform(a => a[0])
    .safeParse(params)

  if (!alias.success)
    return

  endpointAlias.value = alias.data as any
}

// #endregion

// #region Gateway

const endpoint = computed(() => {
  if (!endpointAlias.value)
    return undefined

  return endpoints[endpointAlias.value]
})

const endpointsParams = computed(() => {
  if (endpoint.value === undefined)
    return []

  return Object.entries(endpoint.value.parameters)
    .filter(([name, parameter]) => parameter.knownParam !== 'hidden')
})

const gateway = useGateway(toRef(props, 'gateway'))

const hasResponse = ref(false)
const loading = ref(false)
const params = ref<Record<string, any>>({})

const rawResponse = ref<any>('')
const statusCode = ref<number | undefined>(undefined)
const clientResponse = ref<RequestResultForAlias<EndpointAlias>>([])

watch(endpointAlias, () => {
  hasResponse.value = false
  loading.value = true
  clientResponse.value = []
  statusCode.value = undefined
  rawResponse.value = undefined
})

async function send() {
  if (!endpointAlias.value)
    return toast.error('No endpoint selected')

  hasResponse.value = false
  loading.value = true
  clientResponse.value = []
  statusCode.value = undefined
  rawResponse.value = undefined

  const response = await gateway.fetch(endpointAlias.value, toRaw(params.value))

  hasResponse.value = true
  loading.value = false
  clientResponse.value = response

  if ('statusCode' in response)
    statusCode.value = response.statusCode as number

  if ('rawResponse' in response)
    rawResponse.value = response.rawResponse
}
// #endregion

// #region Extra tools
const extraTools = computed<Component[]>(() => {
  const tools: Component[] = []
  switch (endpointAlias.value) {
    case 'createChallenge':
    case 'createAPIKey':
      tools.push(CardAuthChallenge)
      break
    case 'exportConfigBackup':
      tools.push(BtnGatewayDownloadBackup)
      break
  }
  return tools
})
// #endregion

const downloadFileName = computed(() => {
  switch (endpointAlias.value) {
    case 'downloadDDFBundleBlob':
      return `${params.value.hash}.ddf`
    default:
      return 'data.dat'
  }
})

async function download(data: unknown) {
  const blob = isBlob(data) ? data : new Blob([data as any])
  saveAs(blob, downloadFileName.value)
}

function isBlob(data: unknown): data is Blob {
  return data instanceof Blob
}
</script>

<template>
  <v-alert
    v-show="gateway.state?.can({ type: 'REQUEST' } as any) !== true"
    class="ma-2"
    type="error"
    text="Gateway offline, please check the settings."
  />
  <v-card class="ma-2">
    <v-card-title>
      REST Client
    </v-card-title>
    <v-card-text>
      This tool allows you to send requests to the gateway's API.
    </v-card-text>
  </v-card>
  <v-divider />
  <template v-if="gateway.state?.can({ type: 'REQUEST' } as any)">
    <div class="d-flex flex-wrap flex-lg-nowrap">
      <v-card min-width="300px" class="ma-2 mr-0">
        <v-card-title>
          Endpoints
        </v-card-title>
        <v-card-text>
          <VTreeview
            :items="apiTree"
            active-strategy="single-independent"
            mandatory
            density="compact"
            activatable
            item-value="alias"
            @update:activated="selectAPI"
          />
        </v-card-text>
      </v-card>
      <v-card v-if="endpoint" class="ma-2 flex-grow-1">
        <v-form @submit.prevent="send()">
          <v-card-title>
            {{ endpoint.method.toLocaleUpperCase() }}
            {{ ('baseURL' in endpoint ? endpoint.baseURL : '') + endpoint.path }}
          </v-card-title>
          <v-card-subtitle class="text-wrap">
            {{ endpointAlias }} - {{ endpoint.description }}
          </v-card-subtitle>
          <v-card-text>
            <v-card elevation="3">
              <v-card-title class="d-flex">
                Parameters
                <v-spacer />
                <v-switch
                  v-model="fancyUI"
                  label="Fancy UI"
                  inline
                  hide-details
                  inset
                  color="primary"
                  false-icon="mdi-death-star-variant"
                  true-icon="mdi-death-star"
                />
              </v-card-title>
              <v-card-text v-if="endpointsParams.length === 0">
                None
              </v-card-text>
              <v-card-text v-else>
                <input-rest-client-param
                  v-for="([name, parameter]) in endpointsParams"
                  :key="`${endpointAlias}/${name}`"
                  v-model="params"
                  :fancy-ui="fancyUI"
                  :gateway="props.gateway"
                  :name="name"
                  :param="parameter"
                />
              </v-card-text>
            </v-card>
            <component
              :is="tool"
              v-for="(tool, index) in extraTools"
              :key="index"
              class="mt-2"
              :gateway="props.gateway"
            />
          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" color="primary" variant="tonal" elevation="3" size="large">
              Send request
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </div>

    <div v-show="hasResponse">
      <v-container style="max-width: none;">
        <v-row>
          <v-col v-if="statusCode" cols="12" lg="6">
            <v-card>
              <v-card-title>
                API Response
              </v-card-title>
              <v-card-text>
                <v-alert
                  :text="`Status code: ${statusCode}`"
                  :type="statusCode === 200 ? 'success' : 'error'"
                />
                <v-btn
                  v-if="typeof rawResponse === 'object' && rawResponse !== null && rawResponse.type === 'blob'"
                  class="ma-2"
                  append-icon="mdi-download"
                  @click="download(rawResponse.data)"
                >
                  Download Blob
                </v-btn>
                <object-editor
                  v-else-if="rawResponse"
                  v-model="rawResponse"
                  :error="false"
                  height="800px"
                />
                <p v-else class="mt-6 ma-2">
                  No content
                </p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" lg="6">
            <v-card>
              <v-card-title>
                JS Client :
                {{ clientResponse.length }}
                {{ clientResponse.length > 1 ? 'responses' : 'response' }}
              </v-card-title>
              <v-card-text>
                <div v-for="(response, index) of clientResponse" :key="index" elevation="5">
                  <v-alert
                    :text="`Response #${index + 1}`"
                    :type="response.isOk() ? 'success' : 'error'"
                  />
                  <div v-if="response.isOk()">
                    <v-btn
                      v-if="isBlob(response.value)"
                      class="ma-2"
                      append-icon="mdi-download"
                      @click="download(response.value)"
                    >
                      Download Blob
                    </v-btn>
                    <object-editor
                      v-else
                      v-model="response.value"
                      :error="false"
                      height="800px"
                    />
                  </div>
                  <div v-else>
                    <ObjectEditor
                      v-model="response.error"
                      :error="false"
                      height="800px"
                    />
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </template>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
