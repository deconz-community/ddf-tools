import { defineHook } from '@directus/extensions-sdk'
import { Octokit } from '@octokit/core'
import type { Collections } from '../client'

export default defineHook(({ filter /* , action */ }, { env }) => {
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

    const octokit = new Octokit({ auth: meta.providerPayload.accessToken })

    if (user.email === undefined && !meta.providerPayload.userInfo.email) {
      const result = await octokit.request('GET /user/emails', {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      const emailMeta = result.data.filter(email => email?.primary).shift()

      if (emailMeta)
        user.email = emailMeta.email
    }

    if (env.AUTH_GITHUB_ROLE_MAP) {
      const result = await octokit.request('GET /users/{username}/orgs', {
        username: meta.providerPayload.userInfo.login as string,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      const validOrgs = result.data.filter(org => env.AUTH_GITHUB_ROLE_MAP[org.node_id])
      if (validOrgs.length > 0)
        user.role = env.AUTH_GITHUB_ROLE_MAP[validOrgs[0]!.node_id]
    }

    user.avatar_url = meta.providerPayload.userInfo.avatar_url

    return user
  }

  filter('auth.create', (user, meta) => syncUser('auth.create', user as any, meta as any))
  filter('auth.update', (user, meta) => syncUser('auth.update', user as any, meta as any))

  // TODO move to a separate hook that is not a filter one
  /*
  action('auth.login', ({ payload, status, user, provider }) => {
    console.log({ payload, status, user, provider })
  })
  */
})
