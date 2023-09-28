import { defineEndpoint } from '@directus/extensions-sdk'
import type * as Services from '@directus/api/dist/services/index'
import { createError } from '@directus/errors'
import type { Accountability } from '@directus/types'
import { multipartHandler } from './multipart-handler'

const ForbiddenError = createError('FORBIDDEN', 'You need to be authenticated to access this endpoint', 403)

export default defineEndpoint({
  id: 'bundle',
  handler: (router, context) => {
    const services = context.services as typeof Services

    router.post('/upload', (req, res, next) => {
      console.log('Got Request')

      const accountability = 'accountability' in req ? req.accountability as Accountability : null

      if (typeof accountability?.user !== 'string')
        throw new ForbiddenError()

      if (!req.is('multipart/form-data'))
        throw new ForbiddenError()

      console.log('Got Request next')
      next()
    }, multipartHandler, (req, res, next) => {
      console.log('Got Request part 3')

      console.log({ result: req.body })
      /*
      const { PermissionsService } = services

      const permission = new PermissionsService({
        accountability,
        schema: req.schema,
      })
*/

      res.json({ result: 'ok' })
    })
  },
})
