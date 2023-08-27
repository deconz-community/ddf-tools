<script setup lang="ts">
/*
  TODO Ajouter une liste déroulante et pas seulement le nom de là où je suis
*/

const route = useRoute()

const show = ref(true)

const breadcrumbs = computed(() => {
  const items = []
  items.push({
    text: 'Home',
    disabled: false,
    to: '/',
  })

  switch (route.meta.breadcrumbs) {
    case 'none':{
      break
    }
    case 'hide':{
      show.value = false
      break
    }

    case 'resource-path': {
      show.value = true
      items.push({
        text: 'Gateways',
        disabled: false,
        to: '/gateway',
      })
      /* WIP
      const GatewaysStore = useGatewaysStore()
      if (typeof route.params.gateway === 'string') {
        const Config = GatewaysStore.getData(route.params.gateway, 'config')
        items.push({
          text: Config.value?.name ?? route.params.gateway,
          disabled: false,
          to: `/gateway/${route.params.gateway}`,
        })
        if (typeof route.params.domain === 'string') {
          items.push({
            text: route.params.domain,
            disabled: false,
            to: `/gateway/${route.params.gateway}/${route.params.domain}`,
          })
          if (typeof route.params.resource === 'string') {
            const Resource = GatewaysStore.getData(route.params.gateway, route.params.domain as keyof GatewayData, route.params.resource)
            items.push({
              text: Resource.value?.name ?? `#${route.params.resource}`,
              disabled: false,
              to: `/gateway/${route.params.gateway}/${route.params.domain}/${route.params.resource}`,
            })
          }
        }
      }
      */
      break
    }

    case 'page-name':
    default:{
      items.push({
        text: route.name,
        disabled: false,
        to: route.fullPath,
      })
      break
    }
  }

  return items
})
</script>

<template>
  <v-app-bar height="48" elevation="0">
    <div v-show="show">
      <v-breadcrumbs :items="breadcrumbs">
        <template #prepend>
          <v-icon size="small" icon="mdi-sitemap" />
        </template>
      </v-breadcrumbs>
      <v-divider />
    </div>
    <portal-target name="nav-topbar-details" multiple />
  </v-app-bar>
</template>
