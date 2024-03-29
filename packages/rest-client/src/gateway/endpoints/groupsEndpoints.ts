import { makeEndpoint } from '@zodios/core'
import { z } from 'zod'
import { globalParameters } from '../parameters'
import { prepareResponse } from '../utils'
import { groupSchema, groupsSchema, writableGroupActionSchema } from '../schemas/groupSchema'

export const groupsEndpoints = [

  makeEndpoint({
    alias: 'createGroup',
    description: 'Returns the group with the specified id.',
    method: 'post',
    path: '/api/:apiKey/groups',
    response: prepareResponse(
      z.strictObject({ id: z.coerce.number() }),
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: groupSchema.pick({
          name: true,
          type: true,
          class: true,
          uniqueid: true,
        }),

      },
    ],
  }),

  makeEndpoint({
    alias: 'getGroups',
    description: 'Returns a list of all groups. If there are no groups in the system an empty object {} is returned.',
    method: 'get',
    path: '/api/:apiKey/groups',
    response: prepareResponse(
      groupsSchema,
    ),
    parameters: [
      globalParameters.apiKey,
    ],
  }),

  makeEndpoint({
    alias: 'getGroup',
    description: 'Returns the group with the specified id.',
    method: 'get',
    path: '/api/:apiKey/groups/:groupId',
    response: prepareResponse(
      groupSchema,
    ),
    parameters: [
      globalParameters.apiKey,
      globalParameters.groupId,
    ],
  }),

  makeEndpoint({
    alias: 'updateGroup',
    description: 'Sets attributes of a group which are not related to its state.',
    method: 'put',
    path: '/api/:apiKey/groups/:groupId',
    response: prepareResponse(
      groupSchema.pick({ name: true }),
      {
        removePrefix: /^\/groups\/\d+\//,
      },
    ),
    parameters: [
      globalParameters.apiKey,
      {
        name: 'body',
        type: 'Body',
        schema: groupSchema.pick({
          class: true,
          name: true,
          hidden: true,
          lights: true,
          lightsequence: true,
          multideviceids: true,
        }),
      },
    ],
  }),

  makeEndpoint({
    alias: 'updateGroupState',
    description: 'Sets the state of a group.',
    method: 'put',
    path: '/api/:apiKey/groups/:groupId/action',
    response: prepareResponse(
      writableGroupActionSchema,
      {
        removePrefix: /^\/groups\/\d+\/action\//,
      },
    ),
    parameters: [
      globalParameters.groupId,
      {
        name: 'body',
        type: 'Body',
        schema: writableGroupActionSchema,
      },
    ],
  }),

  makeEndpoint({
    alias: 'deleteGroup',
    description: 'Delete a group.',
    method: 'delete',
    path: '/api/:apiKey/groups/:groupId',
    response: prepareResponse(
      z.strictObject({ id: z.coerce.number() }),
      {
        removePrefix: /^\/groups\/\d+\//,
      },
    ),
    parameters: [
      globalParameters.groupId,
    ],
  }),

] as const
