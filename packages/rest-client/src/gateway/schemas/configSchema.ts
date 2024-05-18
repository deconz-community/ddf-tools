import { z } from 'zod'

export const configSchema = z.strictObject({

  // General
  'name': z.string().min(0).max(16).default('Phoscon-GW')
    .describe('Name of the gateway.'),
  'devicename': z.enum(['ConBee', 'RaspBee', 'ConBee II', 'ConBee III', 'RaspBee II']).or(z.string()).default('ConBee II')
    .describe('The product name of the gateway. Valid values are "ConBee", "RaspBee", "ConBee II" and "RaspBee II".'),
  'bridgeid': z.string()
    .describe('The unique identifier for the gateway.'),
  'datastoreversion': z.literal('93').transform(arg => Number.parseInt(arg))
    .describe('The current datastore version. Should be 93.'),
  'modelid': z.literal('deCONZ')

    .describe('Fixed string "deCONZ".'),
  'uuid': z.string()
    .describe('UPNP Unique Id of the gateway'),
  'system': z.enum(['linux-gw', 'other']),
  'runmode': z.enum([
    'normal',
    'shellscript',
    'systemd/gui',
    'systemd/headless',
    'docker',
    'docker/hassio',
  ]).default('normal')
    .describe('How the Gateway software is running.'),

  // Settings
  'websocketnotifyall': z.boolean().default(true)
    .describe('When true all state changes will be signalled through the Websocket connection.'),

  // Time
  'UTC': z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).default(new Date().toISOString().slice(0, -5)),
    z.literal('None'),
  ])
    .describe('Timezone used by the gateway (only on Raspberry Pi). "None" if not further specified.'),
  'localtime': z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).default(new Date().toISOString().slice(0, -5))
    .describe('The localtime of the gateway.'),
  'timeformat': z.enum(['12h', '24h']).default('12h')
    .describe('Stores a value of the timeformat that can be used by other applications. "12h" or "24h"'),
  'timezone': z.union([z.null(), z.string()]).default('Etc/GMT'),
  'ntp': z.optional(z.enum(['synced', 'unsynced']))
    .describe('Only for gateways running on Linux. Tells if the NTP time is "synced" or "unsynced".'),

  // Delays
  'groupdelay': z.number().min(0).max(5000).default(0)
    .describe('Time between two group commands in milliseconds.'),
  'lightlastseeninterval': z.number().min(1).max(65535).default(60)
    .describe('Sets the number of seconds where the timestamp for "lastseen" is updated at the earliest for light resources. '
    + 'For any such update, a seperate websocket event will be triggered.'),

  // Network
  'dhcp': z.boolean()
    .describe('Whether the IP address of the bridge is obtained with DHCP.'),
  'ipaddress': z.string().ip()
    .describe('Gateway IP address.'),
  'mac': z.string()
    .describe('MAC address of the gateway.'),
  'port': z.number().min(0).max(65535).default(80)
    .describe('Port of the REST API server.'),
  'websocketport': z.number().min(0).max(65535).default(443)
    .describe('Port of the Websocket server.'),
  'netmask': z.string().ip()
    .describe('Network mask of the gateway.'),
  'gateway': z.string().ip()
    .describe('Network gateway of the gateway. Not always valid as he calculate using x.x.x.1 where x is the Gateway IP.'),

  // Discovery
  'discovery': z.boolean().default(true).describe('Set gateway discovery over the internet active or inactive.'),
  'announceinterval': z.number().min(0).default(45)
    .describe('Delay in minute between each announce on internet. 0 mean disabled.'),
  'announceurl': z.string().default('https://phoscon.de/discover')
    .describe('Announce url.'),
  'proxyaddress': z.string().ip().or(z.literal('none'))
    .describe('IP Address of the proxy to use for Discovery. (Not supported)'),
  'proxyport': z.number().min(0).max(65535)
    .describe('Port of the proxy to use for Discovery. (Not supported)'),
  'portalservices': z.literal(false)
    .describe('This indicates whether the bridge is registered to synchronize data with a portal account.'),

  // Versions and Updates
  'apiversion': z.string()
    .describe('The version of the deCONZ Rest API.'),
  'swversion': z.string()
    .describe('The software version of the gateway.'),
  'swcommit': z.string()
    .describe('The GIT Commit ID for this release.'),
  'updatechannel': z.enum(['stable', 'alpha', 'beta'])
    .describe('Current update channel of the Gateway software.'),
  'swupdate': z.object({
    version: z.string()
      .describe('New version.'),
    updatestate: z.literal(0)
      .describe('Not used.'),
    url: z.literal('')
      .describe('Not used.'),
    text: z.literal('')
      .describe('Not used.'),
    notify: z.literal(false)
      .describe('Not used.'),
  })
    .describe('Software update'),

  'swupdate2': z.object({
    bridge: z.object({
      state: z.enum(['noupdates', 'allreadytoinstall', 'transferring', 'installing']),
      lastinstall: z.string().transform(date => new Date(date)),
    }),
    checkforupdate: z.boolean(),
    state: z.enum(['noupdates', 'allreadytoinstall', 'transferring', 'installing']),
    autoinstall: z.object({
      on: z.boolean(),
      updatetime: z.union([z.literal(''), z.string().transform(date => new Date(date))]),
    }),
    lastchange: z.union([z.literal(''), z.string().transform(date => new Date(date))]),
  })
    .describe('The software version of the gateway.'),

  'fwversion': z.string()
    .describe('The current Zigbee firmware version.'),
  'fwneedupdate': z.boolean()
    .describe('If the frimware need an update'),
  'fwupdatestate': z.enum(['idle', 'running'])
    .describe('Current update state.'),
  'otauactive': z.boolean().default(true)
    .describe('OTAU active or inactive.'),
  'otaustate': z.enum(['idle', 'busy', 'off'])
    .describe('Current state of OTA updates.'),

  // Security
  'linkbutton': z.boolean()
    .describe('Enable the link button to allow new applications to generate API keys. True if the gateway is unlocked.'),
  'whitelist': z.record(z.string(), z.object({
    'create date': z.string().transform(date => new Date(date))
      .describe('Creation date.'),
    'last use date': z.string().transform(date => new Date(date))
      .describe('Last use date.'),
    'name': z.string()
      .describe('The device type used when the key was created.'),
  }))
    .describe('An array of whitelisted API keys.'),
  'networkopenduration': z.number().min(0).max(65535).default(60)
    .describe('How long network remains open in seconds.'),
  'permitjoin': z.number().max(255).default(0)
    .describe('Open the network so that other zigbee devices can join. 0 = network closed, 255 = network open, 1–254 = time in seconds the network remains open. The value will decrement automatically.'),
  'permitjoinfull': z.number().default(0)
    .describe('Open the network for x secondes.'),
  'disablePermitJoinAutoOff': z.boolean()
    .describe('Stop the periodic verification for closed network.'),

  // Homebridge
  'homebridge': z.enum(['not-available', 'disabled', 'managed', 'not-managed', 'reset']).or(z.string()),
  'homebridge-pin': z.optional(z.nullable(z.string())),
  'homebridgepin': z.optional(z.nullable(z.string())),
  'homebridgeversion': z.optional(z.nullable(z.string())),
  'homebridgeupdate': z.optional(z.nullable(z.boolean())),
  'homebridgeupdateversion': z.optional(z.nullable(z.string())),

  // Wifi
  'wifi': z.enum(['configured', 'not-configured', 'not-available', 'new-configured', 'deactivated']),
  'wifitype': z.enum(['accesspoint', 'ad-hoc', 'client']),
  'wifiavailable': z.array(z.string()),
  'wifichannel': z.coerce.number(),
  'wificlientname': z.string().or(z.null()),
  'wifiip': z.string().ip(),
  'wifimgmt': z.number(),
  'wifiname': z.string().or(z.null()),

  // Zigbee
  'rfconnected': z.boolean().default(true)
    .describe('Is true when the deCONZ is connected with the firmware and the Zigbee network is up. '
    + 'Set to true to bring the Zigbee network up and false to bring it down. '
    + 'This has the same effect as using the Join and Leave buttons in deCONZ.'),
  'panid': z.number().min(0).max(65535)
    .describe('The Zigbee pan (personal area networks) ID of the gateway.'),
  'zigbeechannel': z.union([
    z.literal(11),
    z.literal(15),
    z.literal(20),
    z.literal(25),
  ])
    .describe('The current wireless frequency channel used by the Gateway. Supported channels: 11, 15, 20, 25.'),

  // Unused
  'replacesbridgeid': z.null()
    .describe('Not used.'),
  'factorynew': z.literal(false)
    .describe('Not used.'),
  'starterkitid': z.literal('')
    .describe('Not used.'),
}).describe('Configuration of the gateway.')

export const writableConfigSchema = configSchema.pick({
  discovery: true,
  groupdelay: true,
  lightlastseeninterval: true,
  name: true,
  otauactive: true,
  permitjoin: true,
  rfconnected: true,
  timeformat: true,
  timezone: true,
  updatechannel: true,
  UTC: true,
  zigbeechannel: true,
  websocketnotifyall: true,
}).extend({
  utc: configSchema.shape.UTC,
  unlock: z.number().min(0).max(600).default(0)
    .describe('Unlock the gateway so that apps can register themselves to the gateway (time in seconds).'),
})
