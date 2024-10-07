import * as vscode from 'vscode';

export class DDBDocument implements vscode.CustomDocument {
    static async create(uri: vscode.Uri): Promise<DDBDocument> {
        // Lire le contenu du fichier
        const fileData = await vscode.workspace.fs.readFile(uri);
        return new DDBDocument(uri, fileData);
    }

    private readonly _uri: vscode.Uri;
    private _documentData: Uint8Array;
    private readonly _onDidDispose = new vscode.EventEmitter<void>();

    private constructor(uri: vscode.Uri, initialContent: Uint8Array) {
        this._uri = uri;
        this._documentData = initialContent;
    }

    public get uri(): vscode.Uri {
        return this._uri;
    }

    public get documentData(): Uint8Array {
        return this._documentData;
    }

    dispose(): void {
        this._onDidDispose.fire();
        this._onDidDispose.dispose();
    }

    public readonly onDidDispose = this._onDidDispose.event;
}