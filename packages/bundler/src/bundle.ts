import type { BundleData } from './types'
import { asArray } from './utils'

export function Bundle() {
  const data: BundleData = {
    name: 'bundle',
    hash: undefined,
    desc: {
      uuid: '',
      version_deconz: '>2.27.0',
      last_modified: new Date(0),
      vendor: 'Unknown vendor',
      product: 'Unknown product',
      device_identifiers: [],
    },
    files: [],
    signatures: [],
  }

  const generateDESC = () => {
    const ddfcSource = data.files.find(file => file.type === 'DDFC')

    if (!ddfcSource)
      throw new Error('DDFC file not found')

    const ddfc = JSON.parse(ddfcSource.data)

    data.files.forEach((file) => {
      if (!file.last_modified)
        return

      if (file.last_modified > data.desc.last_modified)
        data.desc.last_modified = file.last_modified
    })

    data.desc.device_identifiers = []

    const keys = ['uuid', 'vendor', 'product', 'version_deconz'] as const
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

    if (data.desc.device_identifiers.length > 0) {
      if (data.desc.vendor === 'Unknown vendor')
        data.desc.vendor = data.desc.device_identifiers[0][0]
      if (data.desc.product === 'Unknown product')
        data.desc.product = data.desc.device_identifiers[0][1]
    }
  }

  return { data, generateDESC }
}
