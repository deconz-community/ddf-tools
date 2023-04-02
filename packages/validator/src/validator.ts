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

        const resource: Record<string, unknown> = structuredClone(parsed)
        delete resource.$schema
        delete resource.schema
        delete resource.id
        generics.resources[parsed.id] = resource as GenericsData['resources'][string]
        generics.attributes.push(parsed.id)
        break
      }
      case 'subdevice1.schema.json':

        break

      case 'devcap1.schema.json':
        throw new Error('Got invalid generic file, got data with schema \'devcap1.schema.json\'.')
    }

    updateSchema()
    return parsed
  }

  const validate = (data: unknown) => {
    // Parse first time to check if the base DDF is valid
    const clone = schema.parse(structuredClone(data))
    switch (clone.schema) {
      case 'devcap1.schema.json':
        for (const subdevices of clone.subdevices) {
          // For each subdevices iterate over all resources and check if they are valid
          subdevices.items.forEach((item) => {
            if (generics.attributes.includes(item.name))
              Object.assign(item, generics.resources[item.name])
          })
        }
        break
    }

    // Parse again to check if the DDF with generic is still valid
    return schema.parse(clone)
  }

  return { generics, loadGeneric, validate, getSchema: () => schema }
}
