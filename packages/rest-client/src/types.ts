import type { makeErrors, makeParameters } from '@zodios/core'
import type { Narrow } from '@zodios/core/lib/utils.types'

export function makeParametersObject<
  T extends Record<string | number, ReturnType<typeof makeParameters>[number]>,
>(params: Narrow<T>): T {
  return params as T
}

export function makeErrorsObject<
  T extends Record<string | number, ReturnType<typeof makeErrors>[number]>,
>(params: Narrow<T>): T {
  return params as T
}
