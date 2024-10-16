import type { TextFile } from './types'
import { Bundle } from './bundle'
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

export function getCommonParentDirectory(...paths: string[]): string | undefined {
  if (paths.length === 0) {
    return undefined
  }

  const sep = '/'

  const splitPaths = paths.map(p => p.split(sep))

  const minLength = Math.min(...splitPaths.map(segments => segments.length))
  const commonSegments = []

  for (let i = 0; i < minLength; i++) {
    const segment = splitPaths[0][i]
    if (splitPaths.every(segments => segments[i] === segment)) {
      commonSegments.push(segment)
    }
    else {
      break
    }
  }

  return commonSegments.length > 0 ? commonSegments.join(sep) : undefined
}

export async function buildFromFiles(
  genericDirectory: string,
  ddfPath: string,
  getSource: (path: string) => Promise<Source>,
) {
  const bundle = Bundle()

  bundle.data.name = `${ddfPath.substring(ddfPath.lastIndexOf('/') + 1, ddfPath.lastIndexOf('.'))}`

  const ddfSource = await getSource(ddfPath)

  const ddfDir = ddfPath.substring(0, ddfPath.lastIndexOf('/'))

  const bundleRoot = getCommonParentDirectory(genericDirectory, ddfDir)

  bundle.data.files = [{
    data: await ddfSource.stringData,
    path: bundleRoot !== undefined
      ? ddfPath.substring(bundleRoot.length + 1)
      : ddfPath.substring(ddfPath.lastIndexOf('/') + 1),
    type: 'DDFC',
    last_modified: ddfSource.metadata.last_modified,
  }]

  const ddfc: Record<string, unknown> = await ddfSource.jsonData

  if (ddfc.schema !== 'devcap1.schema.json')
    throw new Error('Invalid schema')

  // #region Build a list of used constants to only include them in the bundle from the constants.json file
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
  // #endregion

  const filesToAdd: {
    url: string
    path: string
    type: TextFile['type']
    patch?: (data: string) => string
  }[] = []

  // #region Download markdown files
  const fileMap = {
    CHLG: 'md:changelog',
    INFO: 'md:info',
    WARN: 'md:warning',
    KWIS: 'md:known_issues',
  } as const

  Object.entries(fileMap).forEach(([type, key]) => {
    if (ddfc[key] !== undefined) {
      for (const filePath of asArray<unknown>(ddfc[key])) {
        if (typeof filePath !== 'string')
          continue

        filesToAdd.push({
          url: new URL(`${ddfPath}/../${filePath}`).href,
          path: filePath,
          type: type as keyof typeof fileMap,
        })
      }
    }
  })
  // #endregion

  // #region Download generic and scripts files
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
                catch {
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
  // #endregion

  // #region Download constants.json
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
  // #endregion

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

    let last_modified: Date | undefined = source.metadata.last_modified

    if (fileToAdd.path === 'generic/constants_min.json') {
      const generic = await getSource(new URL(`${genericDirectory}/constants.json`).href)
      last_modified = generic.metadata.last_modified
    }

    bundle.data.files.push({
      type: fileToAdd.type,
      data,
      last_modified,
      path: fileToAdd.path,
    })
  }))

  bundle.sortFiles()
  bundle.generateDESC()

  return bundle
}
