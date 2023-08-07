import { z } from 'zod'
import { lightSchema } from './lightSchema'

export const groupSchema = z.strictObject({
  id: z.string()
    .describe('The id of the group.'),
  name: z.string().min(1).max(32).default('New group')
    .describe('The name of the group.'),
  type: z.enum(['LightGroup', 'Luminaire', 'Lightsource', 'Room'])
    .describe('The type of the group.'),
  class: z.enum([
    'Living room', 'Kitchen', 'Dining', 'Bedroom', 'Kids bedroom',
    'Bathroom', 'Nursery', 'Recreation', 'Office', 'Gym', 'Hallway',
    'Toilet', 'Front door', 'Garage', 'Terrace', 'Garden', 'Driveway',
    'Carport', 'Other',
    'Home', 'Downstairs', 'Upstairs', 'Top floor', 'Attic', 'Guest room',
    'Staircase', 'Lounge', 'Man cave', 'Computer', 'Studio', 'Music',
    'TV', 'Reading', 'Closet', 'Storage', 'Laundry room', 'Balcony',
    'Porch', 'Barbecue', 'Pool',
  ]).optional()
    .describe('The class of the group. Only available for type Room.'),
  uniqueid: z.string().optional()
    .describe('The unique id of the group.'),
  action: lightSchema.shape.state
    .pick({
      on: true,
      alert: true,
      bri: true,
      colormode: true,
      hue: true,
      sat: true,
      ct: true,
      xy: true,
      effect: true,
    })
    .required()
    .extend({
      scene: z.string().nullable(),
    })
    .describe('The last action which was send to the group.'),
  devicemembership: z.array(z.string())
    .describe('If this group was created by a device (switch or sensor) this list contains the device ids.'),
  etag: z.string()
    .describe('HTTP etag which changes whenever the group changes.'),
  scenes: z.array(z.strictObject({
    id: z.string()
      .describe('The id of the scene.'),
    name: z.string()
      .describe('The name of the scene.'),
    transitiontime: z.number()
      .describe('The transition time of the scene.'),
    lightcount: z.number()
      .describe('The number of lights in the scene.'),
  }))
    .describe('A list of scenes of the group.'),
  state: z.strictObject({
    all_on: z.boolean()
      .describe('true if all lights of the group are on.'),
    any_on: z.boolean()
      .describe('true if any light of the group is on.'),
  }).optional().describe('The state of the group.'),
  lights: z.array(z.string())
    .describe('A list of all light ids of this group. Sequence is defined by the gateway.'),
  hidden: z.boolean()
    .describe('Indicates if this group is hidden.'),
  multideviceids: z.array(z.string())
    .describe('A list of light ids of this group that are subsequent ids from multideviceids with multiple endpoints like the FLS-PP.'),
  lightsequence: z.array(z.string())
    .describe('A list of light ids of this group that can be sorted by the user. Need not to contain all light ids of this group.'),
})
  .describe('Group of the gateway.')

export const groupsSchema = z.record(groupSchema)
  .describe('All groups of the gateway.')

export const writableGroupActionSchema = groupSchema.shape.action.pick({
  on: true,
  bri: true,
  hue: true,
  sat: true,
  ct: true,
  xy: true,
  alert: true,
  effect: true,
  colorloopspeed: true,
  transitiontime: true,
}).extend({
  toggle: z.boolean().optional().default(false)
    .describe('Set to true toggles the lights of that group from on to off or vice versa, false has no effect. '
    + '**Notice:** This setting supersedes the `on` parameter!'),
  colorloopspeed: z.number().optional().default(15)
    .describe('Specifies the speed of a colorloop. 1 = very fast, 255 = very slow (default: 15). '
    + 'This parameter only has an effect when it is called together with effect colorloop.'),
  transitiontime: z.number().optional().default(4)
    .describe('Transition time in 1/10 seconds between two states. Note that not all states support a transition time. '
    + 'For example, a transition time when setting on will be ignored as the Zigbee On and Off commands do not support transition times. '
    + 'In general, light attributes that support a range of values support transition times, while boolean values do not.'),
}).partial()
