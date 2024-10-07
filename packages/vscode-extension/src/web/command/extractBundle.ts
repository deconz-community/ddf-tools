import { decode } from "@deconz-community/ddf-bundler";
import * as vscode from 'vscode';
import { doesFileExist } from "../utils/doesFileExist";
import { removeFileExtension } from "../utils/removeFileExtension";

export function extractBundleCommand(log: vscode.OutputChannel){

    async function extractBundle(uri: vscode.Uri){
        if(!uri) {
            return vscode.window.showErrorMessage('No file selected');
        }
        
        log.appendLine(`Extracting bundle from ${uri.fsPath}`);
        const textEncoder = new TextEncoder();

        try {
            // Lire le contenu du fichier
            const fileContent = await vscode.workspace.fs.readFile(uri);

            const bundle = await decode(new File([fileContent], uri.fsPath));
            const targetDirectory = uri.with({ path: removeFileExtension(uri.path) });
            let targetJson : vscode.Uri | undefined;

            if(await doesFileExist(targetDirectory, vscode.FileType.Directory)){
                vscode.window.showErrorMessage('The target directory ' + targetDirectory.fsPath + 'already exists.');
                return;
            }

            await vscode.workspace.fs.createDirectory(targetDirectory);

            await Promise.all(bundle.data.files.map(file => {
                if(file.path.includes('../')){
                    throw new Error('Invalid file path: ' + file.path);
                }
                let filePath = targetDirectory.with({ path: targetDirectory.path + '/' + file.path });

                if(filePath.fsPath.endsWith('constants_min.json')){
                    filePath = filePath.with({ path: filePath.path.replace('constants_min.json', 'constants.json') });
                }

                if(file.type === 'DDFC'){
                    targetJson = filePath;
                }

                return vscode.workspace.fs.writeFile(filePath, textEncoder.encode(file.data));
            }));
            
            log.appendLine('Bundle extracted to ' + targetDirectory.fsPath);

            if(targetJson) {
                vscode.window.showTextDocument(targetJson);
            }
        } catch (error) {
            log.appendLine(`Failed to extract bundle: ${error.toString()}`);
            vscode.window.showErrorMessage(`Failed to extract bundle: ${error.message}`);
        }

    }

    return extractBundle;
}
