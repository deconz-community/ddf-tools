import { Bundle } from './bundle'
import type { DDFC } from './ddfc'
import { asArray } from './utils'

export async function buildFromFile(path: string, getFile: (path: string) => Promise<Blob>): Promise<ReturnType<typeof Bundle>> {
  const bundle = Bundle()

  bundle.data.name = `${path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))}.ddf`
  bundle.data.ddfc = await (await getFile(path)).text()
  const ddfc: DDFC = JSON.parse(bundle.data.ddfc)

  const manufacturers = asArray(ddfc.manufacturername)
  const modelid = asArray(ddfc.modelid)
  if (manufacturers.length === modelid.length) {
    for (let i = 0; i < manufacturers.length; i++) {
      bundle.data.desc.device_identifiers.push([
        manufacturers[i],
        modelid[i],
      ])
    }
  }

  // TODO Remove binary file
  /*
    const binaryFile = 'https://raw.githubusercontent.com/dresden-elektronik/deconz-rest-plugin/master/img/ddf_subdevice_0.png'
    bundle.data.files.push({
      data_raw: await getFile(binaryFile),
      last_modified: new Date(),
      path: 'ddf_device_0.png',
      type: 'UBIN',
    })
    */

  // Download markdown files
  for (const filePath of asArray(ddfc['md:known_issues'])) {
    bundle.data.files.push({
      data: await (await getFile(new URL(`${path}/../${filePath}`).href)).text(),
      last_modified: new Date(),
      path: filePath,
      type: 'KWIS',
    })
  }

  // Download script files
  const scripts: string[] = []
  if (Array.isArray(ddfc.subdevices)) {
    ddfc.subdevices.forEach((subdevice) => {
      if (Array.isArray(subdevice.items)) {
        subdevice.items.forEach((item) => {
          for (const [_key, value] of Object.entries(item)) {
            if (value.script !== undefined)
              scripts.push(value.script)
          }
        })
      }
    })
  }

  await Promise.all(scripts.map(async (filePath) => {
    bundle.data.files.push({
      data: await (await getFile(new URL(`${path}/../${filePath}`).href)).text(),
      last_modified: new Date(),
      path: filePath,
      type: 'SCJS',
    })
  }),
  )

  return bundle
}
