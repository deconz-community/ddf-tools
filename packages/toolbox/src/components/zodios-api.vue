<script setup lang="ts">
import { isErrorFromAlias } from '@zodios/core'
import type { ApiOf } from '@zodios/core'
import type { gatewayClient } from '@deconz-community/rest-client'
import { useForm } from '@vorms/core'
import { zodResolver } from '@vorms/resolvers/zod'
import init from 'zod-empty'
import { z } from 'zod'

type Client = ReturnType<typeof gatewayClient>

const props = defineProps<{
  client: Client
  api: ApiOf<Client>[number]
  apiKey: string
}>()

const route = useRoute()

const needLoginUrl = computed(() => {
  return props.api.alias === 'resetPassword' && route.path === '/'
})

const result = ref({})
const errorMessage = ref('')

function reset() {
  errorMessage.value = ''
  result.value = {}
}

async function handleSubmit(data: any) {
  data.apiKey = props.apiKey
  reset()

  try {
    // TODO remove body params from data
    switch (props.api.method) {
      case 'get':
        result.value = await props.client.get(props.api.path, { params: data })
        break
      case 'post':
        result.value = await props.client.post(props.api.path, data.body, { params: data })
        break
      case 'put':
        result.value = await props.client.put(props.api.path, data.body, { params: data })
        break
      case 'delete':
        result.value = await props.client.delete(props.api.path, data.body, { params: data })
        break
      default:
        errorMessage.value = 'Unknown api method'
    }
  }
  catch (error) {
    console.log({ error })

    if (isErrorFromAlias(props.client.api, props.api.alias, error)) {
      console.log('isErrorFromAlias')
      const extractDesc = (data: unknown) => {
        if (typeof data === 'string')
          return data
        if (typeof data === 'object' && data !== null) {
          if (typeof data.description === 'string')
            return data.description
          return Object.values(data)
            .map(value => extractDesc(value))
            .join('; ')
        }
      }
      errorMessage.value = `${error.message}: ${extractDesc(error.response.data.error)}`
      console.log(error.response.data)
      result.value = error.response.data
    }
    else if (error instanceof Error) {
      errorMessage.value = error.message
    }
    else if (typeof error === 'string') {
      errorMessage.value = error
    }
    else { console.error(error) }
  }
}

const initialValues = init(z.object(
  (props.api.parameters ?? [])
    .filter(param => param.name !== 'apiKey')
    .reduce(
      (schema, param) => {
        if (param.schema instanceof z.ZodObject)
          schema[param.name] = param.schema.required()
        else
          schema[param.name] = param.schema
        return schema
      },
      {} as Record<string, z.ZodType>,
    ),
))

const paramsForm = useForm({
  initialValues,
  validate: zodResolver(z.object(
    (props.api.parameters ?? [])
      .filter(param => param.name !== 'apiKey')
      .reduce(
        (schema, param) => {
          schema[param.name] = param.schema
          return schema
        },
        {} as Record<string, z.ZodType>,
      ),
  )),
  onSubmit: handleSubmit,
})
</script>

<template>
  <v-card width="100%" class="ma-2">
    <template #title>
      {{ api.alias }} - {{ api.path }}
    </template>

    <template #subtitle>
      {{ api.description }}
    </template>

    <template #text>
      <v-alert
        v-if="needLoginUrl"
        color="error"
        icon="$error"
        variant="tonal"
      >
        This api call work only if referer contain "login.html".
        Please go to this
        <router-link to="/login.html/">
          {{ 'page' }}
        </router-link>
        to use this api.
      </v-alert>

      <v-alert
        v-if="errorMessage"
        color="error"
        icon="$error"
        variant="tonal"
        :text="errorMessage"
      />

      <json-viewer
        :value="result"
        :expand-depth="5"
        copyable
      />
      <template v-if="paramsForm">
        <VForm
          :model-value="!Object.keys(paramsForm.errors).length"
          @submit="paramsForm.handleSubmit"
          @reset="paramsForm.handleReset"
        >
          <template v-for="param in Object.keys(paramsForm.values)" :key="param">
            <VTextField
              v-if="typeof initialValues[param] === 'string'"
              v-model="paramsForm.register(param).value.value"
              :label="param"
              :error-messages="paramsForm.register(param).error.value"
              :error="!!paramsForm.register(param).error.value"
              v-bind="paramsForm.register(param).attrs"
            />
            <VTextField
              v-else-if="typeof initialValues[param] === 'number'"
              v-model.number="paramsForm.register(param).value.value"
              type="number"
              :label="param"
              :error-messages="paramsForm.register(param).error.value"
              :error="!!paramsForm.register(param).error.value"
              v-bind="paramsForm.register(param).attrs"
            />
            <VCheckbox
              v-else-if="typeof initialValues[param] === 'boolean'"
              v-model="paramsForm.register(param).value.value"
              :label="param"
              :error-messages="paramsForm.register(param).error.value"
              :error="!!paramsForm.register(param).error.value"
              v-bind="paramsForm.register(param).attrs"
            />
            <template v-else>
              <ObjectEditor
                v-model="paramsForm.register(param).value.value"
                v-bind="paramsForm.register(param).attrs"
                :label="param"
                :error-messages="paramsForm.register(param).error.value as unknown as Record<string, string>"
                :error="!!paramsForm.register(param).error.value"
              />
            </template>
          </template>
          <VBtn type="reset" color="warning" class="mr-4" @click="reset()">
            Reset
          </VBtn>
          <VBtn type="submit" color="success">
            Make request
          </VBtn>
        </VForm>
      </template>
    </template>
  </v-card>
</template>
