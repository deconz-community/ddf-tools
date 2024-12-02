import type { ExtensionContext } from 'vscode'
import type { LanguageClientOptions } from 'vscode-languageclient'
import { Uri } from 'vscode'
import * as vscode from 'vscode'

import { LanguageClient } from 'vscode-languageclient/browser'

let client: LanguageClient | undefined

export async function registerLanguageClient(context: ExtensionContext) {
  console.log('lsp-web-extension-sample activated!')

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{
      language: 'json',
    }],
    synchronize: {},
    initializationOptions: {},
  }

  client = createWorkerLanguageClient(context, clientOptions)

  await client.start()

  console.log('lsp-web-extension-sample server is ready')
}

export async function unRegisterLanguageClient(): Promise<void> {
  if (client !== undefined) {
    await client.stop()
  }
}

function createWorkerLanguageClient(context: ExtensionContext, clientOptions: LanguageClientOptions) {
  // Create a worker. The worker main file implements the language server.
  const serverMain = Uri.joinPath(context.extensionUri, 'dist/web/languageServer.js')
  const worker = new Worker(serverMain.toString(true))

  // create the language server client to communicate with the server running in the worker
  return new LanguageClient(
    'lsp-web-extension-sample',
    'LSP Web Extension Sample',
    clientOptions,
    worker,
  )
}
