import type { defineEndpoint } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'

type InstallFunction = Extract<Parameters<typeof defineEndpoint>[0], Function>

export interface GlobalContext {
  router: Parameters<InstallFunction>[0]
  context: Parameters<InstallFunction>[1]
  services: typeof Services
  schema: Awaited<ReturnType<Parameters<InstallFunction>[1]['getSchema']>>
}

export interface KeySet {
  public: string
  private: string
  type: 'system'
}
