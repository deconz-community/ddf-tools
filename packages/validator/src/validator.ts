import { mainSchema } from './schema'
import type { GenericsData } from './types'

export function createValidator(generics: GenericsData = { attributes: [], manufacturers: {}, deviceTypes: {} }) {
  let schema = mainSchema(generics)

  const updateSchema = () => {
    schema = mainSchema(generics)
  }

  const loadGeneric = (data: unknown) => {
    const parsed = schema.parse(data)

    switch (parsed.schema) {
      case 'constants1.schema.json':
        generics.manufacturers = {
          ...generics.manufacturers,
          ...parsed.manufacturers,
        }
        generics.deviceTypes = {
          ...generics.deviceTypes,
          ...parsed['device-types'],
        }
        break
      case 'resourceitem1.schema.json':
        if (!generics.attributes.includes(parsed.id))
          generics.attributes.push(parsed.id)
        break

      case 'subdevice1.schema.json':

        break

      case 'devcap1.schema.json':
        throw new Error('Got invalid generic file, got data with schema \'devcap1.schema.json\'.')
    }

    updateSchema()
    return parsed
  }

  const validate = (data: unknown) => {
    return schema.parse(data)
  }

  return { generics, loadGeneric, validate }
}
