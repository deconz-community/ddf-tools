<script setup lang="ts">
const machines = createUseAppMachine()
const app = machines.use('app')

const store = useStore()

type Link = ({ icon: string, title: string, to: string } | 'divider' | { gateway: string })

const links = computed(() => {
  const list: Link[] = []

  list.push({ icon: 'mdi-home', title: 'Home', to: '/' })
  list.push({ icon: 'mdi-folder-zip', title: 'Bundler', to: '/bundler' })
  list.push({ icon: 'mdi-api', title: 'REST Client', to: '/rest-client' })

  if (store.state?.matches('online')) {
    list.push({ icon: 'mdi-view-list', title: 'Bundle list', to: '/store/search' })
    list.push({ icon: 'mdi-upload', title: 'Upload', to: '/store/upload' })
  }

  if (import.meta.env.VITE_DEBUG === 'true')
    list.push({ icon: 'mdi-shovel', title: 'Sandbox', to: '/sandbox' })

  list.push('divider')

  if (app.state) {
    const gateways = Array.from(app.state.context.gateways.keys())
    if (gateways.length > 0) {
      gateways.forEach((gatewayId) => {
        list.push({ gateway: gatewayId })
      })
      list.push('divider')
    }
  }

  list.push({ icon: 'mdi-compass', title: 'Gateways', to: '/gateway' })

  list.push({ icon: 'mdi-cog', title: 'App Settings', to: '/settings' })

  return list
})
</script>

<template>
  <v-navigation-drawer width="72" permanent>
    <v-list id="#nav-level-one-list" nav class="d-flex flex-column pa-0" height="100%">
      <perfect-scrollbar>
        <template v-for="link, _index in links" :key="_index">
          <v-divider v-if="link === 'divider'" />
          <template v-else-if="'gateway' in link">
            <gateway-badge
              :gateway-id="link.gateway"
            />
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
