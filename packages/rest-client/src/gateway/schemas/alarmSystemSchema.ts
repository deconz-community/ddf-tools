import { z } from 'zod'

export const alarmSystemArmmodesRead = z.enum([
  'disarmed',
  'armed_stay',
  'armed_night',
  'armed_away',
])

export const alarmSystemArmmodesWrite = z.enum([
  'disarm',
  'arm_away',
  'arm_stay',
  'arm_night',
])

export const alarmSystemDeviceSchema = z.strictObject({
  armmask: z.union([z.literal('none'), z.string()])
    .describe('A combination of arm modes in which the device triggers alarms. '
      + 'A - armed_away, N - armed_night, S - armed_stay, "none" - for keypads and keyfobs'),
  trigger: z.enum([
    'state/presence',
    'state/open',
    'state/vibration',
    'state/buttonevent',
    'state/on',
  ])
    .describe('Specifies arm modes in which the device triggers alarms. '
      + 'This attribute is not available for keypads and keyfobs.'),
})

export const alarmSystemSchema = z.strictObject({

  name: z.string().min(1).max(32).default('default').describe('The alarm system name.'),

  config: z.strictObject({
    armmode: alarmSystemArmmodesRead
      .describe('The target arm mode.'),
    configured: z.boolean()
      .describe('Is true when a PIN code is configured.'),
    disarmed_entry_delay: z.number().min(0).max(255).describe('The delay in seconds before an alarm is triggered.'),
    disarmed_exit_delay: z.number().min(0).max(255).describe('The delay in seconds before the arm mode is armed.'),
    armed_away_entry_delay: z.number().min(0).max(255).describe('The delay in seconds before an alarm is triggered.'),
    armed_away_exit_delay: z.number().min(0).max(255).describe('The delay in seconds before the arm mode is armed.'),
    armed_away_trigger_duration: z.number().min(0).max(255).describe('The alarm trigger duration.'),
    armed_stay_entry_delay: z.number().min(0).max(255).describe('The delay in seconds before an alarm is triggered.'),
    armed_stay_exit_delay: z.number().min(0).max(255).describe('The delay in seconds before the arm mode is armed.'),
    armed_stay_trigger_duration: z.number().min(0).max(255).describe('The alarm trigger duration.'),
    armed_night_entry_delay: z.number().min(0).max(255).describe('The delay in seconds before an alarm is triggered.'),
    armed_night_exit_delay: z.number().min(0).max(255).describe('The delay in seconds before the arm mode is armed.'),
    armed_night_trigger_duration: z.number().min(0).max(255).describe('The alarm trigger duration.'),
  })
    .describe('The configuration of the alarm system.'),

  state: z.strictObject({
    armstate: z.enum([
      'disarmed',
      'armed_stay',
      'armed_night',
      'armed_away',
      'exit_delay',
      'entry_delay',
      'in_alarm',
      'arming_stay',
      'arming_night',
      'arming_away',
    ])
      .describe('The current alarm system state, which can be different from the config.armmode during state transitions.'),
    seconds_remaining: z.number().min(0).max(255).describe('During "exit_delay" and "entry_delay" states, this value holds the remaining time. '
      + 'In all other states the value is 0.'),
  })
    .describe('The current state of the alarm system.'),

  devices: z.record(z.string(), alarmSystemDeviceSchema)
    .describe('List of devices which are added to the alarm system.'),

}).describe('Configuration of the alarm system.')

export const alarmSystemsSchema = z.record(z.coerce.number(), alarmSystemSchema)
  .describe('All alarm systems of the gateway.')
