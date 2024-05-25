<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import { readUser } from '@directus/sdk'
import type { Collections } from '~/interfaces/store'

const props = defineProps<{
  user: string
}>()

const store = useStore()

const userProfile = computedAsync(
  async () => {
    if (store.profile?.id === undefined)
      return undefined

    // If I look my own profile, I can get it from the profile store
    if (store.profile.id === props.user)
      return store.profile

    return (await store.client?.request<Collections.DirectusUser>(readUser(props.user)))
  },
  undefined, // initial state
)

const avatarSize = 150
// const userProfilLink = computed(() => `https://github.com/${userProfile.value?.name}`)
const tab = ref('bundles')
const bundlesCount = ref(0)
const collectionsCount = ref(0)
</script>

<template>
  <v-card v-if="userProfile" class="ma-2">
    <div class="d-flex">
      <v-avatar class="ma-2" :image="userProfile.avatar_url" size="125" />
      <v-card
        class="ma-2 flex-grow-1"
        :title="`${userProfile?.first_name ?? ''} ${userProfile?.last_name ?? ''}`"
        :subtitle="store.profile?.email ?? undefined"
      >
      <!--
        <v-card-text>
          <v-btn :href="userProfilLink" target="_blank">
            Github profile
          </v-btn>
        </v-card-text>
        -->
      </v-card>
    </div>
  </v-card>
  <v-card class="ma-2">
    <v-tabs v-model="tab">
      <v-tab value="bundles">
        Bundles
        <template v-if="bundlesCount > 0">
          ({{ bundlesCount }})
        </template>
      </v-tab>
      <!--
      <v-tab value="collections">
        Collections
        <template v-if="collectionsCount > 0">
          ({{ collectionsCount }})
        </template>
      </v-tab>
      -->
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="bundles">
          <ListBundles
            :filter="`contributors~'${props.user}'`"
            @update-total-count="(v) => bundlesCount = v"
          />
        </v-window-item>

        <!--
        <v-window-item value="collections">
          <table-collection
            collection="bundle_collection"
            :filter="`contributors~'${props.user}'`"
            @update-total-count="(v) => collectionsCount = v"
          />
        </v-window-item>
        -->
      </v-window>
    </v-card-text>
  </v-card>
</template>

<route lang="json">
{
  "meta": {
    "hideLevelTwoSidebar": true
  }
}
</route>
