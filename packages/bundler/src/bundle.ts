import type { BundleData } from './types'
import { asArray } from './utils'

export function Bundle() {
  const data: BundleData = {
    name: 'bundle.ddf',
    hash: undefined,
    desc: {
      uuid: '00000000-0000-0000-0000-000000000000',
      product: 'Unknown device',
      version: '1.0.0',
      version_deconz: '>2.21.0',
      last_modified: new Date(),
      device_identifiers: [],
    },
    ddfc: '{}',
    files: [],
    signatures: [],
  }

  const checkSignature = () => true

  const generateDESC = () => {
    const ddfc = JSON.parse(data.ddfc)
    data.desc.last_modified = new Date()
    data.desc.device_identifiers = []

    const keys = ['uuid', 'product', 'version', 'version_deconz'] as const
    keys.forEach((key) => {
      if (ddfc[key] !== undefined)
        data.desc[key] = ddfc[key]
    })

    const constants_manufacturers: { [key: string]: string } = (() => {
      const constantsFile = data.files.find(file => file.type === 'JSON' && file.path === 'generic/constants_min.json')
      if (constantsFile === undefined || typeof constantsFile.data !== 'string')
        return {}
      const constantData = JSON.parse(constantsFile.data)
      switch (constantData.schema) {
        case 'constants1.schema.json':
          return constantData.manufacturers
        case 'constants2.schema.json':
          return constantData
        default:
          return {}
      }
    })()

    const manufacturers = asArray(ddfc.manufacturername) as string[]
    const modelid = asArray(ddfc.modelid) as string[]
    if (manufacturers.length === modelid.length) {
      for (let i = 0; i < manufacturers.length; i++) {
        data.desc.device_identifiers.push([
          constants_manufacturers[manufacturers[i]] ?? manufacturers[i],
          modelid[i],
        ])
      }
    }
    else {
      throw new Error('The length of manufacturers and modelids does not match')
    }
  }

  return { data, checkSignature, generateDESC }
}
