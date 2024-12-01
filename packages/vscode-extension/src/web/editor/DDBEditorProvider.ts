import * as vscode from 'vscode'
import { DDBDocument } from './DDBDocument'

export class DDBEditorProvider implements vscode.CustomEditorProvider {
  public static readonly viewType = 'deconz-community-ddf-tools.ddbEditor'
  private readonly outputChannel: vscode.OutputChannel
  private readonly extensionUri: vscode.Uri

  constructor(extensionUri: vscode.Uri, outputChannel: vscode.OutputChannel) {
    this.extensionUri = extensionUri
    this.outputChannel = outputChannel
  }

  public openCustomDocument(uri: vscode.Uri, _openContext: vscode.CustomDocumentOpenContext, _token: vscode.CancellationToken): DDBDocument | Thenable<DDBDocument> {
    this.outputChannel.appendLine(`openCustomDocument called with URI: ${uri.toString()}`)
    return DDBDocument.create(uri)
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
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview)

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
  }

  private getNonce() {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = this.getNonce()

    const vsCodeElementsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'node_modules/@vscode-elements/elements/dist', 'bundled.js'))

    // Retourner le HTML pour le webview
    return /* html */`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DDB Editor</title>
        <script nonce="${nonce}" src="${vsCodeElementsUri}" type="module"></script>
      </head>
      <body>
        <h1 id="h1">H1</h1>
        <h3 id="h3">H3</h3>
        <h5 id="h5">H5</h5>
        <vscode-divider></vscode-divider>
        <h3>Supported Devices</h3>
        <vscode-table zebra bordered-rows>
          <vscode-table-header slot="header">
            <vscode-table-header-cell>Manufacturer name</vscode-table-header-cell>
            <vscode-table-header-cell>Model ID</vscode-table-header-cell>
          </vscode-table-header>
          <vscode-table-body slot="body" id="supported_devices">
          </vscode-table-body>
        </vscode-table>

        <script>
          const vscode = acquireVsCodeApi();

          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
              case 'updateBundleData':
                console.log('updateBundleData', message.bundle);

                const desc = message.bundle.desc;

                const textMap = {
                  h1: (desc.vendor ?? '') + ' ' + (desc.product ?? ''),
                  h3: 'For deconz ' + desc.version_deconz,
                  h5: 'Hash: ' + message.hash,
                }

                Object.entries(textMap).forEach(([key, value]) => {
                  const tag = document.getElementById(key);
                  if(tag) tag.innerText = value
                })

                document.getElementById('supported_devices').innerHTML = desc.device_identifiers.map(([manu,model]) => {
                  console.log({manu,model})
                  return '<vscode-table-row>' +
                      '<vscode-table-cell>'+manu+'</vscode-table-cell>' +
                      '<vscode-table-cell>'+model+'</vscode-table-cell>' +
                    '</vscode-table-row>'
                }).join('')
                
                break;
            }
          });

          
          /*
          vscode.postMessage({
              type: 'update',
              data: btoa(binaryString)
          });
          */
        </script>
      </body>
      </html>
      `
  }
}
