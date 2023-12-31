import { z } from 'zod'

export function websocketSchema() {
  const baseEvent = z.strictObject({
    t: z.literal('event'),
    r: z.union([
      z.literal('groups'),
      z.literal('lights'),
      z.literal('scenes'),
      z.literal('sensors'),
    ]),
  })

  return z.discriminatedUnion('e', [
    baseEvent.extend({
      e: z.literal('added'),
      id: z.string(),
    }),
    baseEvent.extend({
      e: z.literal('changed'),
      id: z.string(),
      config: z.map(z.string(), z.unknown()),
    }),
    baseEvent.extend({
      e: z.literal('deleted'),
      id: z.string(),
    }),
    baseEvent.extend({
      e: z.literal('scene-called'),
      gid: z.string(),
      scid: z.string(),
    }),
  ])

  /*
  return z.strictObject({
    t: z.literal('event'),
    e: z.union([z.literal('changed'), z.literal('added'), z.literal('deleted')]),
    id: z.string(),
    r: z.number(),
    t: z.string(),
    uniqueid: z.string(),
  })
  */
}
