import { defineHook } from '@directus/extensions-sdk'

export default defineHook(async ({ action, init }, { database, env }) => {
  const environmentCollection = 'environment'

  const updateEnv = async (data?: Record<string, string>) => {
    if (data === undefined)
      return
    const skip = ['id', 'statuts', 'sort', 'user_created', 'date_created', 'user_updated', 'date_updated']
    Object.keys(data)
      .filter(key => !skip.includes(key))
      .forEach((key) => {
        env[key.toUpperCase()] = data![key]
      })
  }

  init('cli.before', async () => updateEnv((await database(environmentCollection).select('*'))[0]))
  action(`${environmentCollection}.items.update`, ({ payload }) => updateEnv(payload))
})
