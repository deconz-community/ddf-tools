import { z } from 'zod'
import type { ddfSchema } from '../schema'

export const ddfRefines = [
  validateManufacturerNameAndModelID,
  validateRefreshIntervalAndBindingReportTime,
  validateMandatoryItemsAttributes,
  validateScriptEvalFunctions,
] as const

type DDF = z.infer<ReturnType<typeof ddfSchema>>

function validateManufacturerNameAndModelID(data: DDF, ctx: z.RefinementCtx) {
  const areBothString = typeof data.manufacturername === 'string'
      && typeof data.modelid === 'string'

  if (areBothString)
    return

  const areBothArray = Array.isArray(data.manufacturername)
      && Array.isArray(data.modelid)

  if (areBothArray && data.manufacturername.length !== data.modelid.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_intersection_types,
      message: 'When \'manufacturername\' and \'modelid\' are both arrays they should be the same length',
      path: ['manufacturername', 'modelid'],
    })
    return
  }

  if ((areBothString || areBothArray) === false) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_intersection_types,
      message: 'Invalid properties \'manufacturername\' and \'modelid\' should have the same type',
      path: ['manufacturername', 'modelid'],
    })
  }
}

function validateRefreshIntervalAndBindingReportTime(data: DDF, ctx: z.RefinementCtx) {
  // If there no bindings there is nothing to check
  if (!data.bindings)
    return

  const hexa = (value: string | number) => `0x${(typeof value === 'number' ? value : parseInt(value, 16)).toString(16)}`

  const bindingsReportTime: Record<string, number> = {}
  // Get value in numeric from hexa or numeric value

  // Build bindings max refresh record
  data.bindings.forEach((binding) => {
    if (binding.bind === 'unicast' && binding.report) {
      binding.report.forEach((report) => {
        bindingsReportTime[`${hexa(binding['src.ep'])}.${hexa(binding.cl)}.${hexa(report.at)}`] = report.max
      })
    }
  })

  // For each item with zcl read method
  data.subdevices.forEach((device, device_index) => {
    device.items.forEach((item, item_index) => {
      if (item['refresh.interval'] && item.read && item.read.fn === 'zcl') {
        const endpoint = hexa(item.read.ep ?? device.fingerprint?.endpoint ?? device.uuid[1])
        const ats = Array.isArray(item.read.at)
          ? item.read.at
          : [item.read.at]

        // For each attributes in the read method
        for (let index = 0; index < ats.length; index++) {
          const path = `${endpoint}.${hexa(item.read.cl)}.${hexa(ats[index])}`
          if (bindingsReportTime[path] !== undefined && (item['refresh.interval']) - 60 < bindingsReportTime[path]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `The refresh interval (${item['refresh.interval']} - 60 = ${item['refresh.interval'] - 60})`
              + ` should be greater than the binding max refresh value (${bindingsReportTime[path]}) with a margin of 60 seconds`,
              path: ['subdevices', device_index, 'items', item_index, 'refresh.interval'],
            })
          }
        }
      }
    })
  })
}

function validateMandatoryItemsAttributes(data: DDF, ctx: z.RefinementCtx) {
  // If there no bindings there is nothing to check
  if (!data.bindings)
    return

  // If property is used to check if the device should check for the needed values.
  // An empty if object mean it's always checked.
  interface Rule {
    description: string
    if: {
      item?: string[]
      type?: string[]
    }
    need: {
      item: string[]
    }
  }
  // If the subdevice have one of the item in the array we need the items with the names.
  const rules: Rule[] = [
    /*
    {
      description: 'a device should always have basic attributes.',
      if: {},
      need: {
        item: [
          'attr/id',
          'attr/name',
          'attr/uniqueid',
        ],
      },
    },
    */
    {
      description: 'a color light should always have "state/ct" item.',
      if: {
        type: [
          '$TYPE_COLOR_TEMPERATURE_LIGHT',
          'Color Temperature Light',
          '$TYPE_EXTENDED_COLOR_LIGHT',
          'Extended Color Light',
        ],
      },
      need: {
        item: [
          'state/ct',
        ],
      },
    },
    {
      description: 'a device with "state/ct" need the "min" and "max" values for capability.',
      if: {
        item: ['state/ct'],
      },
      need: {
        item: [
          'cap/color/ct/min',
          'cap/color/ct/max',
          // 'config/color/ct/startup',
        ],
      },
    },
    {
      description: 'a device with "state/x" or "state/y" need the corresponding red, green and blue x and y values.',
      if: {
        item: [
          'state/x',
          'state/y',
        ],
      },
      need: {
        item: [
          'state/x',
          'state/y',
          'cap/color/xy/red_x',
          'cap/color/xy/green_x',
          'cap/color/xy/blue_x',
          'cap/color/xy/red_y',
          'cap/color/xy/green_y',
          'cap/color/xy/blue_y',
          // 'cap/color/ct/computes_xy',
        ],
      },
    },
  ]

  data.subdevices.forEach((device, device_index) => {
    const attributes = device.items.map(item => item.name)

    rules.forEach((rule) => {
      // Check if the rule match the device
      if (Object.keys(rule.if).length === 0 || Object.keys(rule.if).some((kind) => {
        switch (kind) {
          case 'type':
            return rule.if[kind]?.includes(device.type)
          case 'item':
            return attributes.some(attr => rule.if[kind]?.includes(attr))
          default:
            return false
        }
      })) {
        rule.need.item.forEach((item) => {
          if (!attributes.includes(item)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `The device should have the item "${item}" because ${rule.description}`,
              path: ['subdevices', device_index, 'items'],
            })
          }
        })
      }
    })
  })
}

function validateScriptEvalFunctions(data: DDF, ctx: z.RefinementCtx) {
  const functions = ['parse', 'write'] as const
  data.subdevices.forEach((device, device_index) => {
    device.items.forEach((item, item_index) => {
      functions.forEach((func) => {
        const data = item[func]
        if (data === undefined)
          return
        if (!(data.fn === undefined || data.fn === 'zcl' || data.fn === 'zcl:attr' || data.fn === 'zcl:cmd'))
          return

        if (data.eval === undefined && data.script === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The '${func}' function is missing 'eval' or 'script' option.`,
            path: ['subdevices', device_index, 'items', item_index, func],
          })
        }
        if (data.eval !== undefined && data.script !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The '${func}' function is having both 'eval' and 'script' option.`,
            path: ['subdevices', device_index, 'items', item_index, func],
          })
        }
      })
    })
  })
}
