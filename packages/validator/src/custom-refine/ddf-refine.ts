import { z } from 'zod'
import type { ddfSchema } from '../schema'

export const ddfRefines = [
  validateManufacturerNameAndModelID,
  // validateRefreshIntervalAndBindingReportTime,
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
      message: 'When \'manufacturername\' and \'modelid\' are both arrays they should be the same length.',
      path: ['manufacturername', 'modelid'],
    })
    return
  }

  if ((areBothString || areBothArray) === false) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_intersection_types,
      message: 'Invalid properties \'manufacturername\' and \'modelid\' should have the same type.',
      path: ['manufacturername', 'modelid'],
    })
  }
}

function validateRefreshIntervalAndBindingReportTime(data: DDF, ctx: z.RefinementCtx) {
  // If there no bindings there is nothing to check
  if (!data.bindings)
    return

  const bindingsReportTime: Record<string, number> = {}
  // Get value in numeric from hexa or numeric value
  const int = (value: string | number) => typeof value === 'number' ? value : parseInt(value, 16)

  // Build bindings max refresh record
  data.bindings.forEach((binding) => {
    if (binding.bind === 'unicast' && binding.report) {
      binding.report.forEach((report) => {
        bindingsReportTime[`${int(binding['src.ep'])}.${int(binding.cl)}.${int(report.at)}`] = report.max
      })
    }
  })

  // For each item with zcl read method
  data.subdevices.forEach((device, device_index) => {
    device.items.forEach((item, item_index) => {
      if (item['refresh.interval'] && item.read && item.read.fn === 'zcl') {
        const endpoint = int(item.read.ep ?? device.fingerprint?.endpoint ?? device.uuid[1])
        const ats = Array.isArray(item.read.at)
          ? item.read.at
          : [item.read.at]

        // For each attributes in the read method
        for (let index = 0; index < ats.length; index++) {
          const path = `${endpoint}.${int(item.read.cl)}.${int(ats[index])}`

          if (bindingsReportTime[path] !== undefined && bindingsReportTime[path] > item['refresh.interval']) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `The refresh interval (${item['refresh.interval']})`
              + ` is lower then the binding max refresh value (${bindingsReportTime[path]}).`,
              path: ['subdevices', device_index, 'items', item_index, 'refresh.interval'],
            })
          }
        }
      }
    })
  })
}
