<script setup lang="ts">
import { computedAsync, useTimeAgo } from '@vueuse/core'
import { usePocketBase } from '~/composables/usePocketbase'

const props = defineProps<{
  bundle: string
}>()

const { client } = usePocketBase()

const bundle = computedAsync(
  async () => {
    return await client.collection('bundle_tree')
      .getOne(props.bundle, {
        expand: 'contributors',
      })
  },
  null, // initial state
)

const bundleVersions = computedAsync(
  async () => {
    return await client.collection('bundle_version')
      .getList(1, 100, {
        filter: `bundle_tree = "${props.bundle}"`,
        sort: '-version_numeric',
        expand: 'device_identifiers',
      })
  },
  {
    page: 1,
    perPage: 100,
    totalItems: 0,
    totalPages: 0,
    items: [],
  }, // initial state
)

const lastestVersion = computed(() => {
  let candidates = bundleVersions.value.items

  if (candidates.some((item) => {
    return item.deprecated === false
  })) {
    candidates = candidates.filter((item) => {
      return item.deprecated === false
    })
  }

  if (candidates.some((item) => {
    return item.pre_release === false
  })) {
    candidates = candidates.filter((item) => {
      return item.pre_release === false
    })
  }

  return candidates.at(0)
})

const downloadURL = computed(() => {
  if (lastestVersion.value === undefined)
    return undefined

  return client.getFileUrl(lastestVersion.value, lastestVersion.value.file)
})
</script>

<template>
  <v-card v-if="bundle" class="ma-2">
    <template #title>
      {{ bundle.name }}
      <template v-if="lastestVersion">
        <v-chip
          v-if="lastestVersion.pre_release"
          class="ma-2"
          color="orange"
          text-color="white"
          text="Pre-release"
        />
        <chip-user
          v-for="user of bundle.expand.contributors"
          :key="user.id"
          :user="user"
          class="ma-2"
        />

        <v-btn v-if="downloadURL" class="ma-2" :href="downloadURL" prepend-icon="mdi-download">
          Download
        </v-btn>
      </template>
    </template>

    <template v-if="lastestVersion" #subtitle>
      {{ lastestVersion.version }} • Published {{ useTimeAgo(lastestVersion.created).value }}
    </template>

    <template #text>
      <v-alert
        v-if="lastestVersion && lastestVersion.deprecated"
        type="error"
        title="This version has been deprecated"
        :text="lastestVersion.deprecated_description"
      />

      <!--
      <json-viewer v-if="lastestVersion" :value="lastestVersion" :expand-depth="1" />
      -->

      <v-card elevation="2">
        <template #title>
          For devices
        </template>
        <template #text>
          <v-table v-if="lastestVersion">
            <thead>
              <tr>
                <th class="text-left">
                  Device Name
                </th>
                <th class="text-left">
                  Model ID
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in lastestVersion.expand.device_identifiers"
                :key="item.id"
              >
                <td>{{ item.manufacturername }}</td>
                <td>{{ item.modelid }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card>

      <v-card v-if="bundleVersions" elevation="1">
        <template #title>
          All versions
        </template>
        <template #text>
          <v-table v-if="lastestVersion">
            <thead>
              <tr>
                <th class="text-left">
                  Version
                </th>
                <th class="text-left">
                  Deconz Version
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
                v-for="version in bundleVersions.items"
                :key="version.id"
              >
                <td>
                  {{ version.version }}
                  <v-chip
                    v-if="lastestVersion.pre_release"
                    class="ma-2"
                    color="orange"
                    text-color="white"
                    text="Pre-release"
                  />
                  <v-chip
                    v-if="lastestVersion.deprecated"
                    class="ma-2"
                    color="orange"
                    text-color="red"
                    text="Deprecated"
                  />
                </td>
                <td>{{ version.version_deconz }}</td>
                <td>{{ useTimeAgo(version.created).value }}</td>
                <td>
                  <v-btn class="ma-2" :href="client.getFileUrl(version, version.file)" prepend-icon="mdi-download">
                    Download
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card>
      <!--
        <json-viewer v-if="bundle" :value="bundle" :expand-depth="5" />
        <json-viewer v-if="bundleVersions" :value="bundleVersions" :expand-depth="5" />
        <json-viewer v-if="lastestVersion" :value="lastestVersion" :expand-depth="5" />
      -->
    </template>
  </v-card>
</template>
