import { decode } from '@deconz-community/ddf-bundler'
import * as vscode from 'vscode'
import { doesFileExist } from '../utils/doesFileExist'
import { removeFileExtension } from '../utils/removeFileExtension'

export function extractBundleCommand(log: vscode.OutputChannel) {
  // TODO: Handle the case where we merge generic directory instead of creating a new one
  async function getSelectedFile(): Promise<vscode.Uri | undefined> {
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: 'Select Bundle File',
      filters: {
        'Bundle Files': ['ddb'],
      },
    }

    const fileUri = await vscode.window.showOpenDialog(options)
    if (fileUri && fileUri[0]) {
      return fileUri[0]
    }
    return undefined
  }

  async function extractBundle(uri: vscode.Uri | undefined) {
    if (!uri) {
      uri = await getSelectedFile()
      if (!uri) {
        return vscode.window.showErrorMessage('No file selected')
      }
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

      const ddfcPath = bundle.data.files.find(file => file.type === 'DDFC')?.path

      if (!ddfcPath)
        throw new Error('DDFC file not found in the bundle')

      await Promise.all(bundle.data.files.map((file) => {
        if (file.path.includes('../')) {
          throw new Error(`Invalid file path: ${file.path}`)
        }

        let localPath = file.path

        if (file.type === 'JSON' && localPath.endsWith('constants_min.json')) {
          localPath = localPath.replace('constants_min.json', 'constants.json')
          file.data = file.data.replace('"constants2.schema.json"', '"constants.schema.json"')
        }

        if (!['DDFC', 'JSON'].includes(file.type)) {
          localPath = `${ddfcPath.substring(0, ddfcPath.lastIndexOf('/'))}/${localPath}`
        }

        const fullPath = targetDirectory.with({
          path: `${targetDirectory.path}/${localPath}`,
        })

        if (file.type === 'DDFC') {
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
