import { Bundle } from './ddf-bundler'

export async function buildFromFile(path: string, getFile: (path: string) => Promise<Blob>): Promise<ReturnType<typeof Bundle>> {
  const bundle = Bundle()

  bundle.data.name = `${path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))}.ddf`
  bundle.data.ddfc = await (await getFile(path)).text()
  const ddfc = JSON.parse(bundle.data.ddfc)

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
  if (Array.isArray(ddfc['md:known_issues'])) {
    for (const filePath of ddfc['md:known_issues']) {
      bundle.data.files.push({
        data: await (await getFile(new URL(`${path}/../${filePath}`).href)).text(),
        last_modified: new Date(),
        path: filePath,
        type: 'KWIS',
        format: 'markdown',
      })
    }
  }

  // Download script files
  const scripts: string[] = []
  if (Array.isArray(ddfc.subdevices)) {
    ddfc.subdevices.forEach((subdevice) => {
      if (Array.isArray(subdevice.items)) {
        subdevice.items.forEach((item) => {
          for (const [key, value] of Object.entries(item)) {
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
      format: 'javascript',
    })
  }))

  return bundle
}
