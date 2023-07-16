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

    const constants: {
      manufacturers?: [string, string]
      'device-types'?: [string, string]
    } = (() => {
      const constantsFile = data.files.find(
        file => file.type === 'SCJS'
        && file.path === 'generic/constants.json',
      )
      if (constantsFile === undefined || typeof constantsFile.data !== 'string')
        return {}
      return JSON.parse(constantsFile.data)
    })()

    const manufacturers = asArray(ddfc.manufacturername)
    const modelid = asArray(ddfc.modelid)
    if (manufacturers.length === modelid.length) {
      for (let i = 0; i < manufacturers.length; i++) {
        data.desc.device_identifiers.push([
          constants.manufacturers?.[manufacturers[i]] ?? manufacturers[i],
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
