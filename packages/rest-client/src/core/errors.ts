import type { ZodError } from 'zod'

export type CommonErrors<DeconzCodes extends number | never> =
  | CustomError
  | ReturnType<typeof clientError>
  | ReturnType<typeof zodError>
  | (DeconzCodes extends number
    ? ReturnType<typeof deconzError<DeconzCodes>>
    : never)

// #region Custom Error
export interface CustomError {
  type: 'custom'
  code: string
  message: string
}

export function customError(code: string, message: string): CustomError {
  return {
    type: 'custom',
    code,
    message,
  }
}
// #endregion

// #region Client errors
const ERRORS = {
  NO_URL: {
    code: 'NO_URL',
    message: 'No url for the gateway provided',
  },
  NO_FORMAT: {
    code: 'NO_FORMAT',
    message: 'No format for that response',
  },
  PARAMS_PARSE_FAILED: {
    code: 'PARAMS_PARSE_FAILED',
    message: 'Failed to parse data',
  },
  RESPONSE_PARSE_FAILED: {
    code: 'RESPONSE_PARSE_FAILED',
    message: 'Failed to parse data',
  },
  NOT_IMPLEMENTED: {
    code: 'NOT_IMPLEMENTED',
    message: 'Format not implemented',
  },
} as const

export function clientError(code: keyof typeof ERRORS) {
  return {
    type: 'client',
    ...ERRORS[code],
  }
}
// #endregion

// #region Zod Error

export function zodError(on: 'request' | 'response', error: ZodError) {
  if (on === 'request') {
    return {
      type: 'zod',
      code: 'VALIDATION_ERROR_REQUEST',
      message: 'Invalid params provided',
      error,
    } as const
  }
  else {
    return {
      type: 'zod',
      code: 'VALIDATION_ERROR_RESPONSE',
      message: 'Invalid response from the gateway',
      error,
    } as const
  }
}

// #endregion

// #region Deconz Errors
const deconzErrorsMap = {
  1: 'UNAUTHORIZED_USER',
  2: 'INVALID_JSON',
  3: 'RESOURCE_NOT_AVAILABLE',
  4: 'METHOD_NOT_AVAILABLE',
  5: 'MISSING_PARAMETER',
  6: 'PARAMETER_NOT_AVAILABLE',
  7: 'INVALID_VALUE',
  8: 'PARAMETER_NOT_MODIFIABLE',
  11: 'TOO_MANY_ITEMS',
  100: 'DUPLICATE_EXIST',
  501: 'NOT_ALLOWED_SENSOR_TYPE',
  502: 'SENSOR_LIST_FULL',
  601: 'RULE_ENGINE_FULL',
  607: 'CONDITION_ERROR',
  608: 'ACTION_ERROR',
  901: 'INTERNAL_ERROR',

  950: 'NOT_CONNECTED',
  951: 'BRIDGE_BUSY',

  101: 'LINK_BUTTON_NOT_PRESSED',
  201: 'DEVICE_OFF',
  202: 'DEVICE_NOT_REACHABLE',
  301: 'BRIDGE_GROUP_TABLE_FULL',
  302: 'DEVICE_GROUP_TABLE_FULL',
  402: 'DEVICE_SCENES_TABLE_FULL',
} as const

export type DeconzErrorCodes = keyof typeof deconzErrorsMap

export type DeconzError<Code extends DeconzErrorCodes | number> =
    Code extends DeconzErrorCodes
      ? (typeof deconzErrorsMap)[Code]
      : 'UNKNOWN_ERROR'

export function deconzError<Code extends number>(
  code: Code,
  address: string = '',
): {
    type: 'deconz'
    code: DeconzError<Code>
    address: string
  } {
  return {
    type: 'deconz',
    code: (code in deconzErrorsMap)
      ? deconzErrorsMap[code as DeconzErrorCodes] as any
      : 'UNKNOWN_ERROR',
    address,
  }
}

// #endregion
