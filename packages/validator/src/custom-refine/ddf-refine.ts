import { z } from 'zod'
import { constantsSchema2 } from '../schema'
import type { ddfSchema } from '../schema'
import type { GenericsData } from '../types'

type DDF = z.infer<ReturnType<typeof ddfSchema>>
type Constants2 = z.infer<ReturnType<typeof constantsSchema2>>

export const ddfRefines = {
  'devcap1.schema.json': [
    validateManufacturerNameAndModelID,
    validateRefreshIntervalAndBindingReportTime,
    validateMandatoryItemsAttributes,
    validateScriptEvalFunctions,
    validateMandatoryItemsForDevices,
    validateNumToStrParseSrcItem,
  ],
  'constants2.schema.json': [
    validateConstants2,
  ],
} as const

function validateManufacturerNameAndModelID(data: DDF, ctx: z.RefinementCtx, _generics: GenericsData) {
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

function validateRefreshIntervalAndBindingReportTime(data: DDF, ctx: z.RefinementCtx, _generics: GenericsData) {
  // If there no bindings there is nothing to check
  if (!data.bindings)
    return

  const hexa = (value: string | number) => `0x${(typeof value === 'number' ? value : Number.parseInt(value, 16)).toString(16)}`

  const bindingsReportTime: Record<string, number> = {}
  // Get value in numeric from hexa or numeric value

  // Build bindings max refresh record
  data.bindings.forEach((binding) => {
    if (binding.bind === 'unicast' && binding.report) {
      binding.report.forEach((report) => {
        // If the max value is 65535 it means that the binding is not used
        if (report.max === 65535)
          return
        bindingsReportTime[`${hexa(binding['src.ep'])}.${hexa(binding.cl)}.${hexa(report.at)}`] = report.max
      })
    }
  })

  // For each item with zcl read method
  data.subdevices.forEach((device, device_index) => {
    device.items.forEach((item, item_index) => {
      if (item['refresh.interval'] && item.read && item.read.fn === 'zcl:attr') {
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

function validateMandatoryItemsAttributes(data: DDF, ctx: z.RefinementCtx, _generics: GenericsData) {
  // If property is used to check if the device should check for the needed values.
  // An empty if object mean it's always checked.
  // If both item and type are present in "if", any condition should be true.

  // By default the condition is of type "and"
  type Condition = string | Condition[] | { or: Condition[] } | { and: Condition[] }

  interface Rule {
    description: string
    if: {
      item?: Condition
      type?: Condition
    }
    need: {
      item: Condition
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
      description: 'a device with "state/ct" need the "min" and "max" values for capability.',
      if: {
        item: 'state/ct',
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
      description: 'a device with "cap/color/ct/computes_xy" need the corresponding state/{x,y} items',
      if: {
        item: 'cap/color/ct/computes_xy',
      },
      need: {
        item: [
          'state/x',
          'state/y',
          'state/ct',
        ],
      },
    },
    {
      description: 'a device with "state/x" or "state/y" need the corresponding cap/color/xy/{red,green,blue}/{x,y} items',
      if: {
        item: {
          or: [
            'state/x',
            'state/y',
          ],
        },
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
        ],
      },
    },
    {
      description: 'a "(Extended) Color light" need ("state/x" and "state/y") or/and ("state/hue" and "state/sat") .',
      if: {
        type: {
          or: [
            '$TYPE_EXTENDED_COLOR_LIGHT',
            'Extended color light',
            '$TYPE_COLOR_LIGHT',
            'Color light',
          ],
        },
      },
      need: {
        item: {
          or: [
            [
              'state/x',
              'state/y',
            ],
            [
              'state/hue',
              'state/sat',
            ],
          ],
        },
      },
    },
  ]

  const processCondition = (condition: Condition, check: (value: string) => boolean): boolean => {
    if (typeof condition === 'string')
      return check(condition)

    if (Array.isArray(condition))
      return condition.every(value => processCondition(value, check))

    if ('and' in condition)
      return condition.and.every(value => processCondition(value, check))

    if ('or' in condition)
      return condition.or.some(value => processCondition(value, check))
    return false
  }

  data.subdevices.forEach((device, device_index) => {
    const attributes = device.items.map(item => item.name)

    rules.forEach((rule) => {
      // Check if the rule match the device
      if (Object.keys(rule.if).length === 0 || Object.entries(rule.if).some(([kind, condition]) => {
        switch (kind) {
          case 'type':
            return processCondition(condition, value => value === device.type)
          case 'item':
            return processCondition(condition, value => attributes.includes(value))
          default:
            return false
        }
      })) {
        if (!processCondition(rule.need.item, value => attributes.includes(value))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The device is missing some items because ${rule.description}`,
            path: ['subdevices', device_index, 'items'],
          })
        }
      }
    })
  })
}

function validateScriptEvalFunctions(data: DDF, ctx: z.RefinementCtx, _generics: GenericsData) {
  const functions = ['parse', 'write'] as const
  data.subdevices.forEach((device, device_index) => {
    device.items.forEach((item, item_index) => {
      functions.forEach((func) => {
        const data = item[func]
        if (data === undefined)
          return
        if (!(data.fn === undefined || data.fn === 'zcl:attr' || data.fn === 'zcl:cmd'))
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

function validateConstants2(data: Constants2, ctx: z.RefinementCtx, _generics: GenericsData) {
  const baseSchema = constantsSchema2({
    attributes: [],
    resources: {},
    manufacturers: {},
    deviceTypes: {},
    subDevices: {},
  })

  Object.keys(data).forEach((key) => {
    if (Object.keys(baseSchema.shape).includes(key))
      return
    if (!['$MF_', '$TYPE_'].some(prefix => key.startsWith(prefix))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The constant key should start with \'$MF_\' or \'$TYPE_\'',
        path: [key],
      })
      return
    }
    if (typeof data[key] !== 'string') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The constant value should be a string',
        path: [key],
      })
    }
  })
}

function validateMandatoryItemsForDevices(data: DDF, ctx: z.RefinementCtx, generics: GenericsData) {
  data.subdevices.forEach((device, device_index) => {
    const generic = generics.subDevices[device.type]
    if (!generic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The device is missing the device definition for the type "${device.type}"`,
        path: ['subdevices', device_index, 'items'],
      })
      return
    }

    let list = generic.items

    if (generic.items_optional)
      list = list.filter(item => !generic.items_optional!.includes(item))

    list.forEach((item) => {
      if (!device.items.find(i => i.name === item)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `The device should have the item "${item}" because it is mandatory for devices of type "${device.type}"`,
          path: ['subdevices', device_index, 'items'],
        })
      }
    })
  })
}

function validateNumToStrParseSrcItem(data: DDF, ctx: z.RefinementCtx, _generics: GenericsData) {
  data.subdevices.forEach((device, device_index) => {
    const list = device.items.map(item => item.name)
    device.items.forEach((item, item_index) => {
      if (item.parse && item.parse.fn === 'numtostr') {
        if (!list.includes(item.parse.srcitem)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The device should have the item "${item.parse.srcitem}" because it is used in the 'numtostr' function`,
            path: ['subdevices', device_index, 'items', item_index, 'parse', 'srcitem'],
          })
        }
      }
    })
  })
}
