<script setup lang="ts">
import type { EndpointAlias, RequestResultForAlias } from '@deconz-community/rest-client'
import { endpoints, gatewayClient } from '@deconz-community/rest-client'
import { useRouteQuery } from '@vueuse/router'

import { VTreeview } from 'vuetify/labs/VTreeview'
import { z } from 'zod'

const props = defineProps<{
  gateway: string
}>()

// #region API Tree

interface APITree {
  title: string
  children: {
    alias: string
    title: string
  }[]
}

const apiTree: APITree[] = []

Object.entries(endpoints).forEach(([alias, api]) => {
  const path = api.path.replace('/api/{:apiKey:}', '')
  const parts = path.substring(1).split('/')
  const categoryTitle = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const title = `${api.method.toUpperCase()} ${path}`

  const leaf = apiTree.find(leaf => leaf.title === categoryTitle)
  if (leaf) {
    if (!leaf.children)
      leaf.children = []
    leaf.children.push({
      alias,
      title,
    })
  }
  else {
    apiTree.push({
      title: categoryTitle,
      children: [{
        alias,
        title,
      }],
    })
  }
})

function selectAPI(params: unknown) {
  const alias = z.array(z.string())
    .length(1)
    .transform(a => a[0])
    .safeParse(params)

  if (!alias.success)
    return

  selectedAlias.value = alias.data
}

// #endregion

// #region Gateway

const selectedAlias = useRouteQuery('alias', 'discover')

const endpointAlias = computed(() => {
  const alias = selectedAlias.value as keyof typeof endpoints
  if (typeof alias !== 'string' || !(alias in endpoints))
    return undefined

  return alias
})

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

const rawResponse = ref<any>(undefined)
const statusCode = ref<number | undefined>(undefined)
const clientResponse = ref<RequestResultForAlias<EndpointAlias>>([])

watch(selectedAlias, () => {
  hasResponse.value = false
  loading.value = true
  clientResponse.value = []
  statusCode.value = undefined
  rawResponse.value = undefined
})

async function send() {
  if (!selectedAlias.value)
    return toast.error('No endpoint selected')

  if (!endpointAlias.value)
    return toast.error('Invalid endpoint selected')

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
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="2" sm="4">
        <v-card>
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
      </v-col>
      <v-col cols="8" sm="8">
        <v-card v-if="endpoint">
          <v-form @submit.prevent="send()">
            <v-card-title>
              {{ endpoint.method.toLocaleUpperCase() }}
              {{ ('baseURL' in endpoint ? endpoint.baseURL : '') + endpoint.path }}
            </v-card-title>
            <v-card-subtitle>
              {{ endpoint.description }}
            </v-card-subtitle>
            <v-card-text>
              <v-card elevation="3">
                <v-card-title>
                  Parameters
                </v-card-title>
                <v-card-text v-if="endpointsParams.length === 0">
                  None
                </v-card-text>
                <v-card-text v-else>
                  <input-rest-client-param
                    v-for="([name, parameter], index) in endpointsParams"
                    :key="index"
                    v-model="params"
                    :gateway="props.gateway"
                    :name="name"
                    :param="parameter"
                  />
                </v-card-text>
              </v-card>
            </v-card-text>
            <v-card-actions>
              <v-btn type="submit" color="primary" variant="tonal" elevation="3" size="large">
                Send request
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card>
      </v-col>
      <v-col v-show="hasResponse" cols="6" sm="6">
        <v-card>
          <v-card-title>
            API Response
          </v-card-title>
          <v-card-text>
            <v-card elevation="5">
              <v-card-title>
                <v-alert
                  :text="`Status code: ${statusCode}`"
                  :type="statusCode === 200 ? 'success' : 'error'"
                />
              </v-card-title>
              <v-card-text>
                <pre>{{ rawResponse }}</pre>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-show="hasResponse" cols="6" sm="6">
        <v-card>
          <v-card-title>
            JS Client :
            {{ clientResponse.length }}
            {{ clientResponse.length > 1 ? 'responses' : 'response' }}
          </v-card-title>
          <v-card-text>
            <v-card v-for="(response, index) of clientResponse" :key="index" elevation="5">
              <v-card-title>
                <v-alert
                  :text="`Response #${index + 1}`"
                  :type="response.isOk() ? 'success' : 'error'"
                />
              </v-card-title>

              <v-card-text v-if="response.isOk()">
                <pre>{{ response.value }}</pre>
              </v-card-text>

              <v-card-text v-else>
                <pre>{{ response.error }}</pre>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": false
  }
}
</route>
