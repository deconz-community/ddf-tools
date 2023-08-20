<script setup lang="ts">
const GatewaysStore = useGatewaysStore()

type Link = ({ icon: string ; title: string ;to: string } | 'divider' | 'gateways')

const links = computed(() => {
  const list: Link[] = []

  list.push({ icon: 'mdi-home', title: 'Home', to: '/' })
  list.push({ icon: 'mdi-shovel', title: 'Sandbox', to: '/sandbox' })
  list.push({ icon: 'mdi-upload', title: 'Upload', to: '/upload' })
  list.push('divider')
  if (objectKeys(GatewaysStore.credentials).length > 0) {
    list.push('gateways')
    list.push('divider')
  }
  list.push({ icon: 'mdi-compass', title: 'Gateways', to: '/gateway' })

  return list
})
</script>

<template>
  <v-navigation-drawer width="72" permanent>
    <v-list id="#nav-level-one-list" nav class="d-flex flex-column pa-0" height="100%">
      <perfect-scrollbar>
        <template v-for="link, _index in links" :key="_index">
          <v-divider v-if="link === 'divider'" />
          <template v-else-if="link === 'gateways'">
            <template v-for="item, uuid in GatewaysStore.credentials" :key="item.id">
              <gateway-badge :uuid="uuid" :credentials="item" />
            </template>
          </template>
          <v-list-item v-else class="ma-1 justify-center">
            <btn-rounded-circle :to="link.to">
              <v-icon :icon="link.icon" size="x-large" />
              <v-tooltip location="right" activator="parent">
                {{ link.title }}
              </v-tooltip>
            </btn-rounded-circle>
          </v-list-item>
        </template>

        <!--
        <v-list-item class="ma-1 justify-center">
          <dialog-add-gateway>
            <template #btn="{ props: btnProps }">
              <btn-rounded-circle v-bind="{ ...btnProps }">
                <v-icon icon="mdi-plus" size="x-large" />
                <v-tooltip location="right" activator="parent">
                  Add Gateway
                </v-tooltip>
              </btn-rounded-circle>
            </template>
          </dialog-add-gateway>
        </v-list-item>
        -->
      </perfect-scrollbar>
    </v-list>
  </v-navigation-drawer>
</template>
