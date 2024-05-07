import { z } from 'zod'

export const lightSchema = z.object({

  configid: z.string().optional(),
  lastannounced: z.string().transform(value => new Date(value)).or(z.null())
    .describe('Last time the device announced itself to the network.'),
  lastseen: z.string().transform(value => new Date(value)).or(z.null())
    .describe('Last time the device has transmitted any data.'),
  levelmin: z.number().optional(),

  name: z.string().default('New light')
    .describe('The name of the light.'),

  poweronlevel: z.number().optional(),
  poweronct: z.number().optional(),
  powerup: z.number().optional()
    .describe('SETTABLE. Brightness to set after power on (limited to DE devices).'),

  productid: z.string().optional()
    .describe('An identifier unique to the product.'),
  productname: z.string().optional()
    .describe('The name of the product.'),

  swconfigid: z.string().optional(),

  type: z.string().describe('Human readable type of the light.'),

  uniqueid: z.string()
    .describe('The unique id of the light. It consists of the MAC address of the light '
    + 'followed by a dash and an unique endpoint identifier in the range 01 to FF.'),

  // OLD Ligne 289

  manufacturername: z.string()
    .describe('The manufacturer of the light device.'),

  modelid: z.string()
    .describe('An identifier unique to the product.'),

  colorcapabilities: z.array(z.unknown()).or(z.number()).optional()
    .describe('The color capabilities as reported by the light.'),

  capabilities: z.strictObject({
    alerts: z.array(z.string()),
    color: z.strictObject({
      ct: z.strictObject({
        max: z.number(),
        min: z.number(),
      }),
      effects: z.array(z.string()).optional(),
      modes: z.array(z.enum([
        'gradient',
        'effect',
        'ct',
        'hs',
        'xy',
      ])),
    }),
  }).optional()
    .describe('The color capabilities as reported by the light.'),

  ctmin: z.number().optional()
    .describe('The minimum mired color temperature value a device supports.'),
  ctmax: z.number().optional()
    .describe('The maximum mired color temperature value a device supports.'),
  hascolor: z.boolean().optional()
    .describe('Indicates if the light can change color. '
    + 'Deprecated - use state instead: if light has no color colormode, hue and xy will not be shown.'),

  swversion: z.string().or(z.null()).describe('Firmware version.'),

  etag: z.string(),

  config: z.object({}).passthrough().optional()
    .describe('Configuration of the light.'),

  state: z.strictObject({
    on: z.boolean().optional()
      .describe('true if the light was turned on.'),
    bri: z.number().min(0).max(255).optional()
      .describe('Brightness of the light. Depending on the lights 0 might not mean visible "off" but minimum brightness.'),
    colormode: z.enum(['hs', 'xy', 'ct']).optional()
      .describe('The color mode of the light. Currently "hs", "xy" and "ct" are supported.'),
    hue: z.number().min(0).max(65535).optional()
      .describe('The hue parameter in the HSV color model is between 0°–360° and is mapped to 0–65535 to get 16-bit resolution.'),
    sat: z.number().min(0).max(255).optional()
      .describe('Color saturation there 0 means no color at all and 255 is the greatest saturation of the color.'),
    ct: z.number().min(153).max(500).or(z.literal(0)).optional()
      .describe('The color temperature in mireds. 153 is the warmest color and 500 is the coldest color.'),
    xy: z.array(z.number().min(0).max(1)).length(2).optional()
      .describe('CIE xy color space coordinates as array [x, y] of real values (0–1).'),
    alert: z.enum(['none', 'select', 'lselect']).or(z.string()).optional()
      .describe('Temporary alert effect. "none" — light is not performing an alert, "select" — light is blinking a short time, '
      + '"lselect" — light is blinking a longer time'),
    effect: z.enum(['none', 'colorloop']).optional()
      .describe('The effect of the light. Currently "none" and "colorloop" are supported.'),
    reachable: z.boolean()
      .describe('true if the light is reachable.'),

    speed: z.number().min(0).max(6).optional()
      .describe('SETTABLE. Sets the speed of fans/ventilators.'),

    open: z.boolean().optional(),
    lift: z.number().min(0).max(100).optional()
      .describe('SETTABLE. Sets the lift of the blinds.'),
    tilt: z.number().min(0).max(100).optional()
      .describe('SETTABLE. Sets the tilt of the blinds.'),

  })
    .describe('The last action which was send to the light.'),

}).describe('Light of the gateway.')

export const lightsSchema = z.record(lightSchema)
  .describe('All lights of the gateway.')
