import { defineHook } from '@directus/extensions-sdk'

export default defineHook(({ filter, action }) => {
  console.log('I\'m a hook!')
  filter('items.create', () => {
    console.log('Creating Item!')
  })

  action('items.create', () => {
    console.log('Item created!')
  })
})
