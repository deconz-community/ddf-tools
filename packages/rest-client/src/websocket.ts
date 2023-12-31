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
    uniqueid: z.optional(z.string()),
  })

  return z.discriminatedUnion('e', [
    baseEvent.extend({
      e: z.literal('added'),
      id: z.string(),
      group: z.optional(z.map(z.string(), z.unknown())),
      light: z.optional(z.map(z.string(), z.unknown())),
      sensor: z.optional(z.map(z.string(), z.unknown())),
    }),
    baseEvent.extend({
      e: z.literal('changed'),
      id: z.string(),
      name: z.optional(z.string()),
      config: z.optional(z.map(z.string(), z.unknown())),
      state: z.optional(z.map(z.string(), z.unknown())),
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
}
