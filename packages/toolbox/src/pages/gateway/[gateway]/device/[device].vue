<script setup lang="ts">
/*
import type { DDFDescriptor } from '@deconz-community/rest-client'
import { toastError } from '~/lib/handleError'
import { gatewayRequest } from '~/machines/gateway'

const props = defineProps<{
  gateway: string
  device: string
}>()

const machines = createUseAppMachine()
const gateway = machines.use('gateway', computed(() => ({ id: props.gateway })))

function test() {
  gateway.state?.context.gateway?.setDeviceDDFPolicy({
    hash: '64ff180d340c15bb3a5136d5f336d1ca5a216ed16b1369c8439d6952478e58ac',
    policy: 'pin',

  }, {
    params: {
      deviceUniqueID: props.device,
    },
  })
}

const device = machines.use('device', computed(() => ({ gateway: props.gateway, id: props.device })))
const { cloned: deviceName, sync: syncName } = useCloned(() => device.state?.context.data?.name ?? '')

async function updateDeviceName() {
  const client = device.state?.context.gatewayClient
  const deviceId = device.state?.context.data?.subdevices[0].uniqueid
  const deviceType = device.state?.context.data?.subdevices[0].type
  if (!client || !deviceId || !deviceType)
    return toastError('Device not found')

  try {
    console.log(deviceType)
    if (['Color temperature light'].includes(deviceType)) {
      console.log('updateLight')
      const result = await client.updateLight({ name: deviceName.value }, { params: { lightId: deviceId } })
      toast.success('Device name updated', { description: result.success?.name })
    }
    else {
      const result = await client.updateSensor({ name: deviceName.value }, { params: { sensorId: deviceId } })
      toast.success('Device name updated', { description: result.success?.name })
    }
  }
  catch (error) {
    toastError(error)
  }

  // http://localhost:4000/ddf-tools/#/store/search?model=SOMRIG+shortcut+button&showNonStable=false&manufacturer=IKEA+of+Sweden
  // syncName()
}

const avaliableBundles = computed(() => {
  const bundles = gateway.state?.context.bundles
  const manufacturername = device.state?.context.data?.manufacturername
  const modelid = device.state?.context.data?.modelid

  if (!bundles || !manufacturername || !modelid)
    return []

  const avaliableBundles: (DDFDescriptor & { hash: string })[] = []

  bundles.forEach((bundle, hash) => {
    if (bundle.device_identifiers.some((deviceIdentifier) => {
      return deviceIdentifier[0] === manufacturername
        && deviceIdentifier[1] === modelid
    }))
      avaliableBundles.push({ hash, ...bundle })
  })

  return avaliableBundles
})
*/
</script>

<template>
  Nothing to see here
  <!--
  <v-card v-if="device.state && device.state.context.data" class="ma-2">
    <v-card-title>
      {{ device.state.context.data.name }}
      <v-btn :disabled="device.state.matches('fetching') === true" @click="device.send({ type: 'REFRESH' })">
        REFRESH
      </v-btn>
      <v-btn
        :to="{
          path: '/store/search',
          query: {
            showStableOnly: 'false',
            model: device.state.context.data.modelid,
            manufacturer: device.state.context.data.manufacturername,
          },
        }"
      >
        Store
      </v-btn>
    </v-card-title>
    <v-card-subtitle>
      {{ device.state.context.data.manufacturername }} - {{ device.state.context.data.modelid }}
    </v-card-subtitle>
    <v-card-text>
      <v-text-field
        v-model="deviceName"
        label="Name"
        append-icon="mdi-content-save"
        @click:append="updateDeviceName"
      />
      <v-btn @click="test()">
        Test
      </v-btn>

      <v-btn @click="gateway.send({ type: 'REFRESH_BUNDLES' })">
        Refresh Bundles
      </v-btn>

      <v-card v-for="bundle in avaliableBundles" :key="bundle.hash" class="ma-2">
        <v-card-title>
          {{ bundle.product }}
          <v-chip class="ma-2" color="grey">
            {{ bundle.hash.substring(bundle.hash.length - 10) }}
          </v-chip>
        </v-card-title>
        <v-card-subtitle>
          UUID : {{ bundle.uuid }}
        </v-card-subtitle>
        <v-card-text>
          Published : {{ useTimeAgo(bundle.last_modified).value }}
          <pre>{{ bundle }}</pre>
        </v-card-text>
        <v-card-actions>
          -->
  <!--
            gatewayRequest('updateConfig', { name }, {
        onDone: (response) => {
          if (response.success) {
            toast.success('Gateway name updated')
            gatewayMachine.send({ type: 'REFRESH_CONFIG' })
          }
          else {
            toast.error('Failed to update gateway name')
            console.error(response)
          }
        },
      })

          -->
  <!--
          <v-btn
            @click="() => gateway.send(gatewayRequest('setDeviceDDFPolicy', {
              policy: 'pin',
              hash: bundle.hash,
            }, {
              deviceUniqueID: device.state.context.data.uniqueid,
            }))"
          >
            Install
          </v-btn>
        </v-card-actions>
      </v-card>

      <v-sheet elevation="10">
        <pre>{{ device.state.context.data }}</pre>
      </v-sheet>
    </v-card-text>
  </v-card>
  <v-card v-else class="ma-3">
    <v-card-title>
      Loading device {{ props.device }}
    </v-card-title>
    <v-card-text>
      <v-progress-linear indeterminate />
    </v-card-text>
  </v-card>
-->
</template>

<route lang="json">
{
  "meta": {
    "layout": "gateway",
    "hideLevelTwoSidebar": false
  }
}
</route>
