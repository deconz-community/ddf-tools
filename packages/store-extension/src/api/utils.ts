import type { Accountability } from '@directus/types'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Collections } from '../client'
import type { InstallFunctionParams } from './types'

export function asyncHandler(fn: RequestHandler) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)
}

export async function fetchUserContext(accountability: Accountability, userId: string, globalParams: InstallFunctionParams) {
  const { schema, context, services } = globalParams
  const serviceOptions = { schema, knex: context.database, accountability }
  const userService = new services.UsersService(serviceOptions)
  const settingsService = new services.SettingsService(serviceOptions)

  const settingsFields = [
    'private_key_stable',
    'public_key_stable',
    'private_key_beta',
    'public_key_beta',
    'private_key_deprecated',
    'public_key_deprecated',
  ] as const

  const userFields = [
    'id',
    'private_key',
    'public_key',
    'is_contributor',
  ] as const

  const [
    settings,
    userInfo,
  ] = await Promise.all([
    settingsService.readSingleton({
      fields: settingsFields as any,
    }),
    userService.readOne(userId, {
      fields: userFields as any,
    }),
  ]) as any

  return {
    settings,
    userInfo,
  } as {
    settings: Pick<Collections.DirectusSettings, typeof settingsFields[number]>
    userInfo: Pick<Collections.DirectusUser, typeof userFields[number]>
  }
}
