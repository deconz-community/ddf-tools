<script setup lang="ts">
import type { Collections } from '~/interfaces/store'

const props = defineProps<{
  title: string
  icon?: string
  users: Collections.DirectusUser[] | Collections.DirectusUser
}>()

const users = computed(() => {
  if (Array.isArray(props.users))
    return props.users
  else
    return [props.users]
})
</script>

<template>
  <v-list v-if="users.length > 0" lines="one">
    <v-list-item :title="props.title" :prepend-icon="props.icon ?? 'mdi-account'" />
    <v-list-item
      v-for="user of users"
      :key="user.id"
    >
      <v-list-item-title>
        <chip-user
          :user="user"
        />
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>
