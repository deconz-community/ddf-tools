import { mainSchema } from './schema'
import type { GenericsData } from './types'

export function createValidator(generics: GenericsData = {
  attributes: [],
  manufacturers: {},
  deviceTypes: {},
  resources: {},
}) {
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
      case 'resourceitem1.schema.json':{
        if (generics.attributes.includes(parsed.id))
          throw (new Error(`Got duplicate resource item with attribute id '${parsed.id}'.`))

        const resource: Record<string, unknown> = parsed
        const resource_id = parsed.id

        delete resource.$schema
        delete resource.schema
        delete resource.id

        generics.resources[resource_id] = resource as GenericsData['resources'][string]
        generics.attributes.push(resource_id)
        break
      }
      case 'subdevice1.schema.json':
        // No rules check for subdevice generic
        break

      case 'devcap1.schema.json':
        throw new Error('Got invalid generic file, got data with schema \'devcap1.schema.json\'.')
    }

    updateSchema()

    return true
  }

  const validate = (data: unknown) => {
    return schema.parse(data)
  }

  return { generics, loadGeneric, validate, getSchema: () => schema }
}
