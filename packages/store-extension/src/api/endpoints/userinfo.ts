import { InvalidQueryError } from '@directus/errors'
import type { InstallFunctionParams } from '../types'
import { asyncHandler } from '../utils'

export function userinfoEndpoint({ router, context, services, schema }: InstallFunctionParams) {
  router.get('/userinfo', asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600')

    const serviceOptions = {
      schema,
      knex: context.database,
    }

    const filter: Partial<Record<'public_key' | 'id', string>> = {}

    if (typeof req.query.userKey === 'string')
      filter.public_key = req.query.userKey

    if (typeof req.query.userId === 'string')
      filter.id = req.query.userId

    if (Object.keys(filter).length === 0) {
      throw new InvalidQueryError({
        reason: 'You must post either a userKey or a userId',
      })
    }

    const userService = new services.UsersService(serviceOptions)
    const result = await userService.readByQuery({
      fields: [
        'id',
        'first_name',
        'last_name',
        'date_created',
        'public_key',
        'avatar',
        'is_contributor',
      ],
      // @ts-expect-error - I added this field don't worry
      filter,
    })

    const user = result.pop()

    if (!user) {
      throw new InvalidQueryError({
        reason: 'User not found',
      })
    }

    user.avatar_url = user.avatar ? `${context.env.PUBLIC_URL}/assets/${user.avatar}` : undefined

    delete user.avatar

    res.json(user)
  }))
}
