import * as vscode from 'vscode';

export class DDBFileSystemProvider implements vscode.FileSystemProvider {

    private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

	readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._onDidChangeFile.event;

    private readonly outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.outputChannel.appendLine('DDBFileSystemProvider created');
    }

    copy?(source: vscode.Uri, destination: vscode.Uri, options: { readonly overwrite: boolean; }): void | Thenable<void> {
        this.outputChannel.appendLine('copy called');
        console.log('copy', {source, destination, options});
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[] }): vscode.Disposable {
        // Implémentation de la surveillance des fichiers si nécessaire
        console.log('watch', {uri, options});
        this.outputChannel.appendLine('watch called');
        return new vscode.Disposable(() => {});
    }

    stat(uri: vscode.Uri): vscode.FileStat {
        const filePath = uri.fsPath;
        console.log('stat', filePath);
        this.outputChannel.appendLine('stat called');
        return {
            type: vscode.FileType.Directory,
            ctime: 1,
            mtime: 1,
            size: 1
        };
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
        this.outputChannel.appendLine('readDirectory called');
        const dirPath = uri.fsPath;
        console.log('readDirectory', dirPath);
        return [
            ['/file1', vscode.FileType.File]
        ];
    }

    createDirectory(uri: vscode.Uri): void {
        const dirPath = uri.fsPath;
        this.outputChannel.appendLine('createDirectory called');
        console.log('createDirectory', dirPath);
    }

    readFile(uri: vscode.Uri): Uint8Array {
        this.outputChannel.appendLine('readFile called');
        const filePath = uri.fsPath;
        console.log('readFile', filePath);
        return new Uint8Array();
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean }): void {
        const filePath = uri.fsPath;
        this.outputChannel.appendLine('writeFile called');
        console.log('writeFile', {uri, content, options});
    }

    delete(uri: vscode.Uri, options: { recursive: boolean }): void {
        const filePath = uri.fsPath;
        this.outputChannel.appendLine('delete called');
        console.log('delete', {uri, options});
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {
        const oldPath = oldUri.fsPath;
        const newPath = newUri.fsPath;
        this.outputChannel.appendLine('rename called');
        console.log('delete', {oldPath, newPath});

    }
}