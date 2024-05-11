<script setup lang="ts">
import { getParamZodSchema } from '@deconz-community/rest-client'

const props = defineProps<{
  gateway: string
}>()

const gateway = useGateway(toRef(props, 'gateway'))

const editName = useDialogAction(() => {
  if (!gateway.config)
    return

  const currentName = gateway.config.name

  return {
    title: 'Update gateway name',
    contentComponentProps: {
      label: 'Name',
      placeholder: currentName,
    },
    defaultValue: currentName,
    confirmationText: 'Save',
    schema: getParamZodSchema('updateConfig', 'config').shape.name,
    onSubmit: async (name) => {
      if (name === currentName)
        return toast.info('No changes made')

      const results = await gateway.fetch('updateConfig', { config: { name } })

      results.forEach((result) => {
        if (result.isOk()) {
          toast.success('Gateway name updated')
          gateway.send({ type: 'REFRESH_CONFIG' })
        }
        else {
          console.error(result.error)
          toast.error('Failed to update gateway name', {
            description: result.error.message,
          })
        }
      })
    },
  }
})
</script>

<template>
  <v-btn icon="mdi-pencil" @click="editName()" />
</template>
