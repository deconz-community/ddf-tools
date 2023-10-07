import { version } from '../package.json'
import { mainSchema } from './schema'
import type { FileDefinition, FileDefinitionWithError, GenericsData } from './types'

export function createValidator(generics: GenericsData = {
  attributes: [],
  manufacturers: {},
  deviceTypes: {},
  resources: {},
  subDevices: {},
}) {
  let schema = mainSchema(generics)

  const updateSchema = () => {
    schema = mainSchema(generics)
  }

  const isGeneric = (schema: string) => {
    return [
      'constants1.schema.json',
      'constants2.schema.json',
      'resourceitem1.schema.json',
      'subdevice1.schema.json',
    ].includes(schema)
  }

  const isDDF = (schema: string) => {
    return schema === 'devcap1.schema.json'
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
      case 'constants2.schema.json':{
        Object.keys(parsed).filter(k => k.startsWith('$MF_')).forEach((k) => {
          generics.manufacturers[k] = parsed[k as keyof typeof parsed]! as string
        })
        Object.keys(parsed).filter(k => k.startsWith('$TYPE_')).forEach((k) => {
          generics.deviceTypes[k] = parsed[k as keyof typeof parsed]! as string
        })
        break
      }
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
        // Index by type and name
        generics.subDevices[parsed.type] = parsed
        // TODO Remove by name ?
        generics.subDevices[parsed.name] = parsed
        break

      default:
        throw new Error(`Got invalid generic file, got data with schema '${parsed.schema}'.`)
    }

    updateSchema()

    return true
  }

  const validate = (data: unknown) => {
    return schema.parse(data)
  }

  const bulkValidate = (genericFiles: FileDefinition[], ddfFiles: FileDefinition[], callbacks: {
    onSectionStart?: (type: 'generic' | 'ddf', total: number) => void
    onSectionProgress?: (type: 'generic' | 'ddf', current: number, total: number) => void
    onSectionEnd?: (type: 'generic' | 'ddf', total: number, errors: FileDefinitionWithError[]) => void
  } = {}): FileDefinitionWithError[] => {
    const processFiles = (files: FileDefinition[], type: 'generic' | 'ddf') => {
      let count = 0
      let previousErrorCount = Number.POSITIVE_INFINITY
      let filesToProcess = files
      let errorFiles: FileDefinitionWithError[] = []

      callbacks.onSectionStart?.(type, files.length)

      while (true) {
        errorFiles = []

        callbacks.onSectionProgress?.(type, 1, files.length)

        filesToProcess.forEach((file) => {
          callbacks.onSectionProgress?.(type, count++, files.length)

          try {
            if (type === 'generic')
              loadGeneric(file.data)
            else if (type === 'ddf')
              validate(file.data)
          }
          catch (error) {
            errorFiles.push({
              ...file,
              error: error as Error,
            })
          }
        })

        if (errorFiles.length === 0)
          break

        // We didn't make any progress, so we stop
        if (errorFiles.length >= previousErrorCount)
          break

        count -= errorFiles.length
        filesToProcess = errorFiles
        previousErrorCount = errorFiles.length
      }

      callbacks.onSectionEnd?.(type, files.length, errorFiles)

      return errorFiles
    }

    return [
      ...processFiles(genericFiles, 'generic'),
      ...processFiles(ddfFiles, 'ddf'),
    ]
  }

  return { generics, loadGeneric, validate, bulkValidate, getSchema: () => schema, version, isGeneric, isDDF }
}
