import { Uri, window } from 'vscode'
import { doesFileExist } from './doesFileExist'

export async function findGenericDirectory(filePath: Uri): Promise<Uri | undefined> {
  const directoryPath = Uri.joinPath(filePath, '../')

  if (directoryPath.fsPath === filePath.fsPath) {
    return undefined
  }

  try {
    if (await doesFileExist(Uri.joinPath(directoryPath, 'generic', 'constants.json'))) {
      return Uri.joinPath(directoryPath, 'generic')
    }
    else {
      return findGenericDirectory(directoryPath)
    }
  }
  catch (error) {
    if (error instanceof Error)
      window.showErrorMessage(`Failed to find generic directory: ${error.message}`)
    return undefined
  }
}
