import * as vscode from 'vscode'
import { DDBDocument } from './DDBDocument'

export class DDBEditorProvider implements vscode.CustomEditorProvider {
  public static readonly viewType = 'deconz-community-ddf-tools.ddbEditor'
  private readonly outputChannel: vscode.OutputChannel
  private readonly extensionUri: vscode.Uri

  constructor(extensionUri: vscode.Uri, outputChannel: vscode.OutputChannel) {
    this.extensionUri = extensionUri
    this.outputChannel = outputChannel

    // TODO: Download signatures from the store and store them in memory here
    this.outputChannel.appendLine('DDBEditorProvider initialized')
  }

  public openCustomDocument(uri: vscode.Uri, _openContext: vscode.CustomDocumentOpenContext, _token: vscode.CancellationToken): DDBDocument | Thenable<DDBDocument> {
    this.outputChannel.appendLine(`openCustomDocument called with URI: ${uri.toString()}`)
    return DDBDocument.create(uri)
  }

  public async resolveCustomEditor(
    document: DDBDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    // Configurer le webview
    webviewPanel.webview.options = {
      enableScripts: true,
    }

    // Initialiser le contenu du webview
    webviewPanel.webview.html = await this.getHtmlForWebview(webviewPanel.webview)

    // Gérer les messages du webview
    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case 'update':
          // this.updateBinaryDocument(document, e.data);
      }
    })

    // Initialiser le contenu du webview avec le contenu du document
    webviewPanel.webview.postMessage({
      type: 'updateBundleData',
      bundle: document.bundleData,
      hash: await document.getHash(),
    })

    webviewPanel.onDidChangeViewState(async (e) => {
      if (!e.webviewPanel.visible)
        return

      webviewPanel.webview.postMessage({
        type: 'updateBundleData',
        bundle: document.bundleData,
        hash: await document.getHash(),
      })
    })
  }

  private getNonce() {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    const mainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'views'))
    const file = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(mainUri, 'DDBEditor.html'))
    const textDecoder = new TextDecoder()
    const html = textDecoder.decode(file)
    return html
      .replace('DDBEditor.ts', vscode.Uri.joinPath(mainUri, 'DDBEditor.js').fsPath)
      .replace('nonce-placeholder', this.getNonce())
  }

  saveCustomDocument(_document: DDBDocument, _cancellation: vscode.CancellationToken): Thenable<void> {
    throw new Error('Method not implemented.')
  }

  saveCustomDocumentAs(_document: DDBDocument, _destination: vscode.Uri, _cancellation: vscode.CancellationToken): Thenable<void> {
    throw new Error('Method not implemented.')
  }

  revertCustomDocument(_document: DDBDocument, _cancellation: vscode.CancellationToken): Thenable<void> {
    throw new Error('Method not implemented.')
  }

  backupCustomDocument(_document: DDBDocument, _context: vscode.CustomDocumentBackupContext, _cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
    throw new Error('Method not implemented.')
  }

  onDidChangeCustomDocument!: vscode.Event<vscode.CustomDocumentEditEvent<DDBDocument>> | vscode.Event<vscode.CustomDocumentContentChangeEvent<DDBDocument>>
}
