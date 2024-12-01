import { buildFromFiles, createSource, encode } from '@deconz-community/ddf-bundler'
import * as vscode from 'vscode'

import { DDBEditorProvider } from '../editor/DDBEditorProvider'
import { doesFileExist } from '../utils/doesFileExist'
import { findGenericDirectory } from '../utils/findGenericDirectory'
import { removeFileExtension } from '../utils/removeFileExtension'

export function makeBundleCommand(log: vscode.OutputChannel) {
  async function makeBundle(uri: vscode.Uri) {
    if (!uri) {
      return vscode.window.showErrorMessage('No file selected')
    }

    log.appendLine(`Creating bundle from file ${uri.fsPath}`)

    const targetUri = uri.with({ path: `${removeFileExtension(uri.path)}.ddb` })

    if (await doesFileExist(targetUri)) {
      vscode.window.showErrorMessage(`The target file ${targetUri.fsPath} already exists.`)
      return
    }

    const genericDirectory = await findGenericDirectory(uri)
    if (!genericDirectory) {
      return
    }

    try {
      const bundle = await buildFromFiles(`file://${genericDirectory.path}`, `file://${uri.path}`, async (path) => {
        const inputPath = uri.with({ path: path.replace('file://', '') })
        const data = await vscode.workspace.fs.readFile(inputPath)
        const metadata = await vscode.workspace.fs.stat(inputPath)
        const source = createSource(new Blob([data]), {
          path,
          last_modified: new Date(metadata.mtime),
        })
        return source
      })

      const encoded = await encode(bundle)
      vscode.workspace.fs.writeFile(targetUri, new Uint8Array(await encoded.arrayBuffer()))
      log.appendLine(`Bundle created at ${targetUri.fsPath}`)

      await vscode.commands.executeCommand('vscode.openWith', targetUri, DDBEditorProvider.viewType)
    }
    catch (error) {
      if (typeof error === 'string')
        log.appendLine(`Failed to create bundle: ${error.toString()}`)

      if (error instanceof Error)
        vscode.window.showErrorMessage(`Failed to create bundle: ${error.message}`)
    }
  }

  return makeBundle
}
