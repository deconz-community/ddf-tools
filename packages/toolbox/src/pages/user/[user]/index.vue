<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import { useGithubAvatar } from '~/composables/useGithubAvatar'

const props = defineProps<{
  user: string
}>()

const store = useStore()

const userProfile = computedAsync(
  async () => {
    // If I look my own profile, I can get it from the profile store
    if (store.client?.authStore.model?.id && store.client?.authStore.model.id === props.user)
      return store.client?.authStore.model

    return (await store.client?.collection('user').getOne(props.user))
  },
  null, // initial state
)

const avatarSize = 150
const avatarUrl = useGithubAvatar(computed(() => userProfile.value?.github_id), avatarSize)
const userProfilLink = computed(() => `https://github.com/${userProfile.value?.name}`)
const tab = ref('bundles')
const bundlesCount = ref(0)
const collectionsCount = ref(0)
</script>

<template>
  <v-card class="ma-2">
    <div class="d-flex">
      <v-avatar class="ma-2" :image="avatarUrl" size="125" />
      <v-card
        class="ma-2 flex-grow-1"
        :title="userProfile?.name"
      >
        <v-card-text>
          <v-btn :href="userProfilLink" target="_blank">
            Github profile
          </v-btn>
        </v-card-text>
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
      <v-tab value="collections">
        Collections
        <template v-if="collectionsCount > 0">
          ({{ collectionsCount }})
        </template>
      </v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item value="bundles">
          <ListBundles
            :filter="`contributors~'${props.user}'`"
            @update-total-count="(v) => bundlesCount = v"
          />
        </v-window-item>

        <v-window-item value="collections">
          <table-collection
            collection="bundle_collection"
            :filter="`contributors~'${props.user}'`"
            @update-total-count="(v) => collectionsCount = v"
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>
