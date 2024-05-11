import { z } from 'zod'
import { sensorSchema } from './gateway/schemas/sensorSchema'
import { lightSchema } from './gateway/schemas/lightSchema'
import { groupSchema } from './gateway/schemas/groupSchema'

export type WebsocketEvent = z.infer<ReturnType<typeof websocketSchema>>

type UnionOmit<T, K extends string | number | symbol> = T extends unknown ? Omit<T, K> : never

export function websocketSchema() {
  const firstProcess = z.object({
    t: z.literal('event'),
    e: z.enum(['scene-called', 'added', 'changed', 'deleted']),
    r: z.enum(['alarmsystems', 'scenes', 'sensors', 'lights', 'groups']).optional(),
  }).passthrough()

  const initialSchema = z.preprocess((data) => {
    const initialData = firstProcess.parse(data)
    let eventSchema = ''
    const keys = ['t', 'e', 'r', 'attr', 'state', 'config', 'capabilities'] as const
    keys.forEach((key) => {
      if (key in initialData)
        eventSchema += `/${typeof initialData[key] === 'string' ? initialData[key] : key}`
    })
    return {
      ...initialData,
      eventSchema,
    }
  }, z.discriminatedUnion('eventSchema', [

    /*
    Notes:
    Look for QLatin1String("event") in code
    webSocketServer->broadcastTextMessage
    */

    // #region Alarm system
    // Alarm system state change
    // https://github.com/dresden-elektronik/deconz-rest-plugin/blob/b6eb920ba3ec919f5f525720e551f9b788bf9fa3/alarm_system_event_handler.cpp#L92
    /*
    z.object({
      'event': z.literal('/event/changed/alarmsystems'),
      't': z.literal('event'),
      'e': z.literal('changed'),
      'r': z.literal('alarmsystems'),
      'id': z.string(),
      'state/armstate': z.string(),
      'state/seconds_remaining': z.number(),
    }),
    */
    // #endregion

    // #region Scenes
    // Scene called
    // https://github.com/dresden-elektronik/deconz-rest-plugin/blob/b6eb920ba3ec919f5f525720e551f9b788bf9fa3/de_web_plugin.cpp#L13139
    z.object({
      eventSchema: z.literal('/event/scene-called/scenes'),
      t: z.literal('event'),
      e: z.literal('scene-called'),
      r: z.literal('scenes'),
      gid: z.string(),
      scid: z.string(),
    }),

    // #endregion

    // #region Groups
    // Group added
    // https://github.com/dresden-elektronik/deconz-rest-plugin/blob/b6eb920ba3ec919f5f525720e551f9b788bf9fa3/rest_groups.cpp#L3527
    z.object({
      eventSchema: z.literal('/event/added/groups'),
      t: z.literal('event'),
      e: z.literal('added'),
      r: z.literal('groups'),
      id: z.string(),
    }),

    // Group changed state
    // https://github.com/dresden-elektronik/deconz-rest-plugin/blob/b6eb920ba3ec919f5f525720e551f9b788bf9fa3/rest_groups.cpp#L3512
    z.object({
      eventSchema: z.literal('/event/changed/groups/attr'),
      t: z.literal('event'),
      e: z.literal('changed'),
      r: z.literal('groups'),
      id: z.string(),
      attr: groupSchema.omit({ state: true, etag: true }),
    }),

    // Group changed state
    // https://github.com/dresden-elektronik/deconz-rest-plugin/blob/b6eb920ba3ec919f5f525720e551f9b788bf9fa3/rest_groups.cpp#L3467
    z.object({
      eventSchema: z.literal('/event/changed/groups/state'),
      t: z.literal('event'),
      e: z.literal('changed'),
      r: z.literal('groups'),
      id: z.string(),
      state: groupSchema.shape.state,
    }),

    // Group deleted
    // https://github.com/dresden-elektronik/deconz-rest-plugin/blob/b6eb920ba3ec919f5f525720e551f9b788bf9fa3/rest_groups.cpp#L3537
    z.object({
      eventSchema: z.literal('/event/deleted/groups'),
      t: z.literal('event'),
      e: z.literal('deleted'),
      r: z.literal('groups'),
      id: z.string(),
    }),
    // #endregion

    // #region Sensors
    // New sensor added
    z.object({
      eventSchema: z.literal('/event/added/sensors'),
      t: z.literal('event'),
      e: z.literal('added'),
      r: z.literal('sensors'),
      id: z.string(),
      uniqueid: z.string(),
      sensor: sensorSchema,
    }),

    // Sensor announcement
    z.object({
      eventSchema: z.literal('/event/changed/sensors/attr'),
      t: z.literal('event'),
      e: z.literal('changed'),
      r: z.literal('sensors'),
      id: z.string(),
      uniqueid: z.string(),
      attr: sensorSchema.omit({ state: true, config: true, etag: true }),
    }),

    // Sensor state change
    z.object({
      eventSchema: z.literal('/event/changed/sensors/state'),
      t: z.literal('event'),
      e: z.literal('changed'),
      r: z.literal('sensors'),
      id: z.string(),
      uniqueid: z.string(),
      state: sensorSchema.shape.state,
    }),

    // Sensor config change
    z.object({
      eventSchema: z.literal('/event/changed/sensors/config'),
      t: z.literal('event'),
      e: z.literal('changed'),
      r: z.literal('sensors'),
      id: z.string(),
      uniqueid: z.string(),
      config: sensorSchema.shape.config,
    }),

    // Sensor deleted
    z.object({
      eventSchema: z.literal('/event/sensors/deleted'),
      t: z.literal('event'),
      e: z.literal('deleted'),
      r: z.literal('sensors'),
      id: z.string(),
    }),
    // #endregion

    // #region Lights
    // New light added
    z.object({
      eventSchema: z.literal('/event/added/lights'),
      t: z.literal('event'),
      e: z.literal('added'),
      r: z.literal('lights'),
      id: z.string(),
      uniqueid: z.string(),
      light: lightSchema,
    }),

    // Light announcement
    z.object({
      eventSchema: z.literal('/event/changed/lights/attr'),
      t: z.literal('event'),
      e: z.literal('changed'),
      r: z.literal('lights'),
      id: z.string(),
      uniqueid: z.string(),
      attr: lightSchema.omit({ state: true, config: true, etag: true }),
    }),

    // Light state change
    z.object({
      eventSchema: z.literal('/event/changed/lights/state'),
      t: z.literal('event'),
      e: z.literal('changed'),
      r: z.literal('lights'),
      id: z.string(),
      uniqueid: z.string(),
      state: lightSchema.shape.state,
    }),

    // Light capabilities change
    z.object({
      eventSchema: z.literal('/event/changed/lights/capabilities'),
      t: z.literal('event'),
      e: z.literal('changed'),
      r: z.literal('lights'),
      id: z.string(),
      uniqueid: z.string(),
      capabilities: lightSchema.shape.capabilities,
    }),
    // #endregion
  ]))

  return initialSchema.transform<UnionOmit<z.infer<typeof initialSchema>, 'eventSchema'>>((data: any) => {
    delete data.eventSchema
    return data
  })
}
