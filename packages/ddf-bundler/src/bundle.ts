import type { BundleData } from './types'

export function Bundle() {
  const data: BundleData = {
    name: 'bundle.ddf',
    desc: {
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
