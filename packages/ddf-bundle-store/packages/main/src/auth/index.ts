import { defineHook } from '@directus/extensions-sdk'
import { Octokit } from '@octokit/core'
import type { Collections } from '../client'

export default defineHook(({ filter }) => {
  interface Meta {
    identifier: string
    provider: string
    providerPayload: {
      accessToken: string
      userInfo: {
        avatar_url: string
        email: string
        [key: string]: string | number | boolean | null
      }
    }
  }

  const syncUser = async (_event: string, user: Partial<Collections.DirectusUser>, meta: Meta): Promise<Partial<Collections.DirectusUser>> => {
    if (meta.provider !== 'github')
      return user

    if (user.email === undefined && !meta.providerPayload.userInfo.email) {
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

    user.avatar_url = meta.providerPayload.userInfo.avatar_url

    return user
  }

  filter('auth.create', (user, meta) => syncUser('auth.create', user as any, meta as any))
  filter('auth.update', (user, meta) => syncUser('auth.update', user as any, meta as any))
})
