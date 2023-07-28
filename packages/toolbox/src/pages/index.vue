<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import { usePocketBase } from '~/composables/usePocketbase'

const { client } = usePocketBase()

const bundleList = computedAsync(
  async () => {
    return (await client.collection('bundle_tree').getFullList({ expand: 'contributors' }))
      .sort((a, b) => a.name.localeCompare(b.name))
  },
  null, // initial state
)
</script>

<template>
  <v-btn to="/upload">
    Upload
  </v-btn>
  <v-card class="ma-2">
    <template #title>
      DDF Store Temporary list of bundles
    </template>

    <template #text>
      <v-table>
        <thead>
          <tr>
            <th class="text-left">
              ID
            </th>
            <th class="text-left">
              Name
            </th>
            <th class="text-left">
              Source
            </th>
            <th class="text-left">
              Contributors
            </th>
            <th class="text-left">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="bundle of bundleList"
            :key="bundle.name"
          >
            <td>{{ bundle.id }}</td>
            <td>{{ bundle.name }}</td>
            <td>{{ bundle.source }}</td>
            <td>
              <ul>
                <li v-for="contributor of bundle.contributors" :key="contributor">
                  {{ bundle.expand.contributors.find(c => c.id === contributor).name }}
                </li>
              </ul>
            </td>
            <td>
              <v-btn :to="`/bundle/${bundle.id}`">
                Open
              </v-btn>
              <v-btn v-if="bundle.source_url" :href="bundle.source_url" target="blank">
                Open Source
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
  </v-card>
</template>
