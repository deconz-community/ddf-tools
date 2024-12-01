import { decode } from '@deconz-community/ddf-bundler'
import * as vscode from 'vscode'
import { doesFileExist } from '../utils/doesFileExist'
import { removeFileExtension } from '../utils/removeFileExtension'

export function extractBundleCommand(log: vscode.OutputChannel) {
  // TODO: Handle the case where we merge generic directory instead of creating a new one
  async function extractBundle(uri: vscode.Uri) {
    if (!uri) {
      return vscode.window.showErrorMessage('No file selected')
    }

    log.appendLine(`Extracting bundle from ${uri.fsPath}`)
    const textEncoder = new TextEncoder()

    try {
      // Lire le contenu du fichier
      const fileContent = await vscode.workspace.fs.readFile(uri)

      const bundle = await decode(new File([fileContent], uri.fsPath))
      const targetDirectory = uri.with({ path: removeFileExtension(uri.path) })
      let targetJson: vscode.Uri | undefined

      if (await doesFileExist(targetDirectory, vscode.FileType.Directory)) {
        vscode.window.showErrorMessage(`The target directory ${targetDirectory.fsPath}already exists.`)
        return
      }

      await vscode.workspace.fs.createDirectory(targetDirectory)

      let ddfcPath: string | undefined

      await Promise.all(bundle.data.files.map((file) => {
        if (file.path.includes('../')) {
          throw new Error(`Invalid file path: ${file.path}`)
        }

        let localPath = file.path

        if (localPath.endsWith('constants_min.json')) {
          localPath = localPath.replace('constants_min.json', 'constants.json')
          file.data = file.data.replace('"constants2.schema.json"', '"constants.schema.json"')
        }

        if (!['DDFC', 'JSON'].includes(file.type)) {
          if (!ddfcPath)
            throw new Error('DDFC file not found in the bundle')

          localPath = `${ddfcPath.substring(0, ddfcPath.lastIndexOf('/'))}/${localPath}`
        }

        const fullPath = targetDirectory.with({
          path: `${targetDirectory.path}/${localPath}`,
        })

        if (file.type === 'DDFC') {
          ddfcPath = file.path
          targetJson = fullPath
        }

        return vscode.workspace.fs.writeFile(fullPath, textEncoder.encode(file.data))
      }))

      log.appendLine(`Bundle extracted to ${targetDirectory.fsPath}`)

      if (targetJson) {
        vscode.window.showTextDocument(targetJson)
      }
    }
    catch (error) {
      if (typeof error === 'string') {
        log.appendLine(`Failed to extract bundle: ${error.toString()}`)
      }
      if (error instanceof Error) {
        vscode.window.showErrorMessage(`Failed to extract bundle: ${error.message}`)
      }
    }
  }

  return extractBundle
}
