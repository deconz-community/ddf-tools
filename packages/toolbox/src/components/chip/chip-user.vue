<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'

const props = defineProps<{
  user: {
    id: string
    name: string
    created: string
    github_id: number | null
  }
}>()

const menu = ref(false)

const userAvatar = computed(() => {
  if (props.user.github_id) {
    return `https://avatars.githubusercontent.com/u/${props.user.github_id}?v=4`
  }
  else {
    const hash = '00000000000000000000000000000000'
    const url = new URL(`https://www.gravatar.com/avatar/${hash}`)
    url.searchParams.append('d', 'retro')
    return url.href
  }
},

)
</script>

<template>
  <v-menu
    v-model="menu"
    location="top start"
    origin="top start"
    transition="scale-transition"
  >
    <template #activator="{ props: menu_props }">
      <v-chip
        pill
        v-bind="{ ...menu_props, ...$attrs }"
        link
      >
        <v-avatar start>
          <v-img :src="userAvatar" />
        </v-avatar>
        {{ props.user.name }}
      </v-chip>
    </template>

    <v-card width="300">
      <v-list bg-color="black">
        <v-list-item>
          <template #prepend>
            <v-avatar :image="userAvatar" />
          </template>

          <v-list-item-title>
            {{ props.user.name }}
          </v-list-item-title>

          <v-list-item-subtitle>
            Member since {{ useTimeAgo(props.user.created).value }}
          </v-list-item-subtitle>

          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                variant="text"
                @click="menu = false"
              >
                <v-icon>mdi-close-circle</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>

      <v-list>
        <v-list-item
          :title="`${props.user.name}'s profile`"
          prepend-icon="mdi-account"
          :to="`/user/${props.user.id}`"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>
