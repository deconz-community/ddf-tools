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
    deviceTypes: string[]
  } = {
    manufacturers: typeof ddfc.manufacturername === 'string'
      ? [ddfc.manufacturername]
      : ddfc.manufacturername.filter((name, index) => ddfc.manufacturername.indexOf(name) === index),
    deviceTypes: [],
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
      if (subdevice.type.startsWith('$TYPE_') && !usedConstants.deviceTypes.includes(subdevice.type))
        usedConstants.deviceTypes.push(subdevice.type)

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

  bundle.generateDESC()

  return bundle
}
