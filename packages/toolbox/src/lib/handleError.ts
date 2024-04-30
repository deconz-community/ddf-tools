import { ZodError } from 'zod'

import type { ValidationError } from '@deconz-community/ddf-bundler'

export async function toastError(error: ZodError | Error | unknown) {
  const errors = handleError(error)

  const { toast } = await import(`@neoncoder/vuetify-sonner`)

  errors.forEach((error) => {
    toast.error(error.message)
  })
}

export function handleError(error: ZodError | Error | unknown): ValidationError[] {
  // Directus return errors like this
  if (typeof error === 'object' && error !== null && 'errors' in error && Array.isArray(error.errors))
    return error.errors.map(error => handleError(error)).flat()

  const errorsList: ValidationError[] = []

  if (error instanceof ZodError) {
    // Build error list by json path
    const errors: Record<string, string[]> = {}

    // Build a list of errors based on the path in the JSON like {'subdevices/0/type' : ['error1', 'error2']}
    error.issues.forEach((issue) => {
      const path = issue.path.join('/')
      if (Array.isArray(errors[path]))
        errors[path].push(issue.message)
      else
        errors[path] = [issue.message]
    })

    const paths = Object.keys(errors)

    if (paths.length > 0) {
      paths.forEach((path) => {
        errors[path].forEach((message) => {
          errorsList.push({
            type: 'simple',
            message,
          })
        })
      })
    }
  }
  else if (error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error)) {
    errorsList.push({
      type: 'simple',
      message: String(error.message),
    })
  }
  else if (typeof error === 'string') {
    errorsList.push({
      type: 'simple',
      message: error,
    })
  }
  else {
    errorsList.push({
      type: 'simple',
      message: 'Unknown Error',
    })
  }

  return errorsList
}
