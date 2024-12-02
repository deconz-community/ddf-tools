import type { BundleData } from '@deconz-community/ddf-bundler'
import type { Webview } from 'vscode'

import '@vscode-elements/elements/dist/bundled.js'

/*
import '@vscode-elements/elements/dist/vscode-divider/index.js'

import '@vscode-elements/elements/dist/vscode-table/index.js'
import '@vscode-elements/elements/dist/vscode-table-header/index.js'
import '@vscode-elements/elements/dist/vscode-table-body/index.js'
import '@vscode-elements/elements/dist/vscode-table-row/index.js'
import '@vscode-elements/elements/dist/vscode-table-cell/index.js'
*/

declare function acquireVsCodeApi(): Webview

const vscode = acquireVsCodeApi()

window.addEventListener('message', (event) => {
  const message = event.data
  switch (message.type) {
    case 'updateBundleData':
    {
      console.log('updateBundleData', message.bundle)

      const desc = message.bundle.desc as BundleData['desc']

      const textMap = {
        h1: `${desc.vendor ?? ''} ${desc.product ?? ''}`,
        h3: `For deconz ${desc.version_deconz}`,
        h5: `Hash: ${message.hash}`,
      }

      Object.entries(textMap).forEach(([key, value]) => {
        const tag = document.getElementById(key)
        if (tag)
          tag.textContent = value
      })

      document.getElementById('supported_devices')!.innerHTML = desc.device_identifiers.map(([manu, model]) => {
        return `<vscode-table-row>`
          + `<vscode-table-cell>${manu}</vscode-table-cell>`
          + `<vscode-table-cell>${model}</vscode-table-cell>`
          + `</vscode-table-row>`
      }).join('')

      break
    }
  }
})

export {}

vscode.postMessage({
  type: 'foo',
  data: 'bar',
})

console.log('DDBEditor.ts loaded')
