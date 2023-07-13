import type { BundleData } from './types'

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

  return { checkSignature, data }
}
