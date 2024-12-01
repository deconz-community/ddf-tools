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

  public openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
    this.outputChannel.appendLine(`openCustomDocument called with URI: ${uri.toString()}`)
    return DDBDocument.create(uri)
  }

  saveCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Thenable<void> {
    throw new Error('Method not implemented.')
  }

  saveCustomDocumentAs(document: vscode.CustomDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
    throw new Error('Method not implemented.')
  }

  revertCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Thenable<void> {
    throw new Error('Method not implemented.')
  }

  backupCustomDocument(document: vscode.CustomDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
    throw new Error('Method not implemented.')
  }

  onDidChangeCustomDocument!: vscode.Event<vscode.CustomDocumentEditEvent<vscode.CustomDocument>> | vscode.Event<vscode.CustomDocumentContentChangeEvent<vscode.CustomDocument>>

  public async resolveCustomEditor(
    document: vscode.CustomDocument,
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
    /*
        webviewPanel.webview.postMessage({
            type: 'update',
            data: this.getBinaryData(document)
        });
        */
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
                <vscode-badge>308 Settings Found</vscode-badge>

                <script>
                    const vscode = acquireVsCodeApi();
                    const editor = document.getElementById('editor');

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'update':
                                const binaryString = atob(message.data);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                }
                                editor.value = new TextDecoder().decode(bytes);
                                break;
                        }
                    });

                    editor.addEventListener('input', () => {
                        const text = editor.value;
                        const bytes = new TextEncoder().encode(text);
                        let binaryString = '';
                        for (let i = 0; i < bytes.length; i++) {
                            binaryString += String.fromCharCode(bytes[i]);
                        }
                        vscode.postMessage({
                            type: 'update',
                            data: btoa(binaryString)
                        });
                    });
                </script>
            </body>
            </html>
        `
  }
}
