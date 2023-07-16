import { Bundle, asArray } from '@deconz-community/ddf-bundler'
import type { DDFC, TextFile } from '@deconz-community/ddf-bundler'

export async function buildFromFile(
  genericDirectory: string,
  ddfPath: string,
  getFile: (path: string) => Promise<Blob>,
): Promise<ReturnType<typeof Bundle>> {
  const bundle = Bundle()

  bundle.data.name = `${ddfPath.substring(ddfPath.lastIndexOf('/') + 1, ddfPath.lastIndexOf('.'))}.ddf`
  bundle.data.ddfc = await (await getFile(ddfPath)).text()
  const ddfc: DDFC = JSON.parse(bundle.data.ddfc)

  // Build a list of used constants to only include them in the bundle from the constants.json file
  const usedConstants: {
    manufacturers: string[]
    'device-types': string[]
  } = {
    'manufacturers': [],
    'device-types': [],
  }

  const filesToAdd: {
    url: string
    path: string
    type: TextFile['type']
    patch?: (data: string) => string
  }[] = []

  // Download markdown files
  if (ddfc['md:known_issues'] !== undefined) {
    for (const filePath of asArray(ddfc['md:known_issues'])) {
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
      if (subdevice.type.startsWith('$TYPE_') && !usedConstants['device-types'].includes(subdevice.type))
        usedConstants['device-types'].push(subdevice.type)

      if (Array.isArray(subdevice.items)) {
        subdevice.items.forEach((item) => {
          if (item.name !== undefined) {
            const fileName = `${item.name.replace(/\//g, '_')}_item.json`
            filesToAdd.push({
              url: new URL(`${genericDirectory}/items/${fileName}`).href,
              path: `generic/${fileName}`,
              type: 'JSON',
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

  filesToAdd.push({
    url: new URL(`${genericDirectory}/constants.json`).href,
    path: 'generic/constants.json',
    type: 'JSON',
    patch(data) {
      const decoded = JSON.parse(data)
      const newData = {
        'schema': decoded.schema,
        'manufacturers': {} as Record<string, string>,
        'device-types': {} as Record<string, string>,
      }
      for (const manufacturer of usedConstants.manufacturers) {
        newData.manufacturers[manufacturer] = decoded.manufacturers[manufacturer]
        bundle.data.desc.device_identifiers.forEach((deviceIdentifier) => {
          if (deviceIdentifier[0] === manufacturer)
            deviceIdentifier[0] = decoded.manufacturers[manufacturer]
        })
      }
      for (const deviceType of usedConstants['device-types'])
        newData['device-types'][deviceType] = decoded['device-types'][deviceType]
      return JSON.stringify(newData, null, 4)
    },
  })

  await Promise.all(filesToAdd.map(async (fileToAdd) => {
    let data = await (await getFile(fileToAdd.url)).text()
    if (fileToAdd.patch !== undefined)
      data = fileToAdd.patch(data)
    bundle.data.files.push({
      type: fileToAdd.type,
      data,
      last_modified: new Date(),
      path: fileToAdd.path,
    })
  }),
  )

  bundle.data.files.sort((a, b) => {
    // Sort files by path but with generics last
    const aIsGeneric = a.path.startsWith('generic/')
    const bIsGeneric = b.path.startsWith('generic/')
    if (aIsGeneric && bIsGeneric) {
      if (a.path === 'generic/constants.json')
        return -1
      if (b.path === 'generic/constants.json')
        return 1
      return a.path.localeCompare(b.path)
    }
    if (aIsGeneric)
      return 1
    if (bIsGeneric)
      return -1
    return a.path.localeCompare(b.path)
  })

  bundle.generateDESC()

  return bundle
}
