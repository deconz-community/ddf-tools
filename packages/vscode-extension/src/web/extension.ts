// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DDF_BUNDLE_MAGIC } from '@deconz-community/ddf-bundler';
import { DDBEditorProvider } from './editor/DDBEditorProvider';
import { DDBFileSystemProvider } from './editor/DDBFileSystemProvider';
import { extractBundleCommand } from './command/extractBundle';
import { makeBundleCommand } from './command/makeBundle';
import { registerDDFValidation } from './editor/DDFValidation';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('DDB Editor');
    outputChannel.appendLine('Extension activated');
    // console.clear();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    
    context.subscriptions.push(
        vscode.commands.registerCommand('deconz-community-ddf-tools.helloWorld', () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            vscode.window.showInformationMessage(DDF_BUNDLE_MAGIC);
        })
    );

    
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'deconz-community-ddf-tools.extractBundle',
            extractBundleCommand(outputChannel)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'deconz-community-ddf-tools.makeBundle',
            makeBundleCommand(outputChannel)
        )
    );




    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            DDBEditorProvider.viewType,
            new DDBEditorProvider(context.extensionUri, outputChannel)
        )
    );

    registerDDFValidation(context);

    /*
    const ddbFileSystemProvider = new DDBFileSystemProvider(outputChannel);
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider('ddb', ddbFileSystemProvider, { 
            isCaseSensitive: true
        })
    );
    
    context.subscriptions.push(vscode.commands.registerCommand('deconz-community-ddf-tools.mountBundleFileSystem', (_uri: vscode.Uri) => {
        const uri = vscode.Uri.parse(`ddb:/?${_uri}`);
        if (vscode.workspace.getWorkspaceFolder(uri) === undefined) {
          const name = vscode.workspace.asRelativePath(_uri, true);
          const index = vscode.workspace.workspaceFolders?.length || 0;
          const workspaceFolder: vscode.WorkspaceFolder = { uri, name, index };
          vscode.workspace.updateWorkspaceFolders(index, 0, workspaceFolder);
        }
      }));
	*/
}

// This method is called when your extension is deactivated
export function deactivate() {}
