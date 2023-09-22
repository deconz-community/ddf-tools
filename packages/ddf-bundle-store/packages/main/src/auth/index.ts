import { defineHook } from '@directus/extensions-sdk'
import { Octokit } from '@octokit/core'

export default defineHook(({ filter }) => {
  interface User {
    first_name: string
    last_name: string
    email: string
    role: string
    auth_data: string | undefined
  }

  interface Meta {
    identifier: string
    provider: string
    providerPayload: {
      accessToken: string
      userInfo: Record<string, string | number | null | boolean>
    }
  }

  const syncUser = async (_event: string, user: Partial<User>, meta: Meta): Promise<Partial<User>> => {
    if (meta.provider !== 'github')
      return user

    if (!meta.providerPayload.userInfo.email) {
      const octokit = new Octokit({ auth: meta.providerPayload.accessToken })

      const result = await octokit.request('GET /user/emails', {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      const emailMeta = result.data.filter(email => email?.primary).shift()

      if (emailMeta)
        user.email = emailMeta.email
    }

    return user
  }

  filter('auth.create', (user, meta) => syncUser('auth.create', user as any, meta as any))
  // filter('auth.update', (user, meta) => syncUser('auth.update', user as any, meta as any))
})
