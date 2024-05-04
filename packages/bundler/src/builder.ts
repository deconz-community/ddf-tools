import { Bundle } from './bundle'
import type { TextFile } from './types'
import { asArray } from './utils'

export type SourceMetadata = {
  path: string
  last_modified: Date
} & Record<string, unknown>

export interface Source<Metadata extends SourceMetadata = SourceMetadata> {
  metadata: Metadata
  readonly rawData: Blob
  readonly stringData: Promise<string>
  readonly jsonData: Promise<Record<string, unknown>>
}

export function createSource<Metadata extends SourceMetadata>(rawData: Blob, metadata: Metadata): Source<Metadata> {
  let stringData: string | undefined
  let jsonData: Record<string, unknown> | undefined

  return {
    metadata,
    get rawData() {
      return rawData
    },
    get stringData() {
      return (async () => {
        if (stringData)
          return stringData
        stringData = await (this.rawData).text()
        return stringData
      })()
    },
    get jsonData() {
      return (async () => {
        if (jsonData)
          return jsonData
        jsonData = JSON.parse(await this.stringData) as Record<string, unknown>
        return jsonData
      })()
    },
  }
}

export async function buildFromFiles(
  genericDirectory: string,
  ddfPath: string,
  getSource: (path: string) => Promise<Source>,
) {
  const bundle = Bundle()

  bundle.data.name = `${ddfPath.substring(ddfPath.lastIndexOf('/') + 1, ddfPath.lastIndexOf('.'))}.ddf`

  const ddfSource = await getSource(ddfPath)
  bundle.data.ddfc = await ddfSource.stringData
  bundle.data.desc.last_modified = ddfSource.metadata.last_modified

  const ddfc: Record<string, unknown> = JSON.parse(bundle.data.ddfc)

  // Build a list of used constants to only include them in the bundle from the constants.json file
  const usedConstants: {
    manufacturers: string[]
    deviceTypes: string[]
  } = {
    manufacturers: [],
    deviceTypes: [],
  }

  if (typeof ddfc.manufacturername === 'string') {
    usedConstants.manufacturers.push(ddfc.manufacturername)
  }
  else if (Array.isArray(ddfc.manufacturername)) {
    ddfc.manufacturername.forEach((name) => {
      if (typeof name !== 'string')
        return

      if (usedConstants.manufacturers.includes(name))
        return

      usedConstants.manufacturers.push(name)
    })
  }

  const filesToAdd: {
    url: string
    path: string
    type: TextFile['type']
    patch?: (data: string) => string
  }[] = []

  // Download markdown files
  if (ddfc['md:known_issues'] !== undefined) {
    for (const filePath of asArray<unknown>(ddfc['md:known_issues'])) {
      if (typeof filePath !== 'string')
        continue

      filesToAdd.push({
        url: new URL(`${ddfPath}/../${filePath}`).href,
        path: filePath,
        type: 'KWIS',
      })
    }
  }

  // Download script files
  if (Array.isArray(ddfc.subdevices)) {
    ddfc.subdevices.forEach((subdevice) => {
      if (subdevice.type.startsWith('$TYPE_') && !usedConstants.deviceTypes.includes(subdevice.type))
        usedConstants.deviceTypes.push(subdevice.type)

      const fileName = `${subdevice.type.replace('$TYPE_', '').toLowerCase()}.json`
      filesToAdd.push({
        url: new URL(`${genericDirectory}/subdevices/${fileName}`).href,
        path: `generic/subdevices/${fileName}`,
        type: 'JSON',
        patch(data) {
          const decoded = JSON.parse(data)
          delete decoded.items_optional
          return JSON.stringify(decoded, null, 4)
        },
      })

      if (Array.isArray(subdevice.items)) {
        subdevice.items.forEach((item: unknown) => {
          if (typeof item !== 'object' || item === null)
            return console.error('Invalid item', item)

          if ('name' in item && typeof item.name === 'string') {
            const fileName = `${item.name.replace(/\//g, '_')}_item.json`
            filesToAdd.push({
              url: new URL(`${genericDirectory}/items/${fileName}`).href,
              path: `generic/items/${fileName}`,
              type: 'JSON',
              patch(data) {
                const decoded = JSON.parse(data)

                try {
                  // @ts-expect-error Try to patch the item. Easier to try than checking types
                  const newItem = item.parse.srcitem
                  if (decoded.parse.srcitem === undefined || newItem === undefined)
                    throw new Error('No srcitem')
                  decoded.parse.srcitem = newItem
                }
                catch (error) {
                  return data
                }

                return JSON.stringify(decoded, null, 4)
              },
            })
          }
          for (const [_key, value] of Object.entries(item)) {
            if (value.script !== undefined) {
              filesToAdd.push({
                url: new URL(`${ddfPath}/../${value.script}`).href,
                path: value.script,
                type: 'SCJS',
              })
            }
          }
        })
      }
    })
  }

  // Download constants.json
  filesToAdd.push({
    url: new URL(`${genericDirectory}/constants.json`).href,
    path: 'generic/constants_min.json',
    type: 'JSON',
    patch(data) {
      const decoded = JSON.parse(data)
      const newData: Record<string, string> = {
        schema: 'constants2.schema.json',
      }
      for (const manufacturer of usedConstants.manufacturers)
        newData[manufacturer] = decoded.manufacturers?.[manufacturer] ?? decoded[manufacturer]
      for (const deviceType of usedConstants.deviceTypes)
        newData[deviceType] = decoded['device-types']?.[deviceType] ?? decoded[deviceType]
      return JSON.stringify(newData, null, 4)
    },
  })

  const paths: string[] = []
  const uniquesFilesToAdd = filesToAdd.filter((file) => {
    if (paths.includes(file.path))
      return false
    paths.push(file.path)
    return true
  })

  await Promise.all(uniquesFilesToAdd.map(async (fileToAdd) => {
    const source = await getSource(fileToAdd.url)
    let data = await source.stringData
    if (fileToAdd.patch !== undefined)
      data = fileToAdd.patch(data)

    let last_modified = source.metadata.last_modified

    if (fileToAdd.path === 'generic/constants_min.json')
      last_modified = (await getSource(ddfPath)).metadata.last_modified

    bundle.data.files.push({
      type: fileToAdd.type,
      data,
      last_modified,
      path: fileToAdd.path,
    })
  }),
  )

  bundle.data.files.sort((a, b) => {
    // Sort files by path but with generics last
    const aIsGeneric = a.path.startsWith('generic/')
    const bIsGeneric = b.path.startsWith('generic/')
    if (aIsGeneric && bIsGeneric) {
      if (a.path === 'generic/constants_min.json')
        return -1
      if (b.path === 'generic/constants_min.json')
        return 1
      return a.path.localeCompare(b.path)
    }
    if (aIsGeneric)
      return 1
    if (bIsGeneric)
      return -1
    return a.path.localeCompare(b.path)
  })

  bundle.generateDESC(true)

  return bundle
}
