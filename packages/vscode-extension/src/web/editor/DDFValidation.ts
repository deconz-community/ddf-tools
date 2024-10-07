import * as vscode from 'vscode';


export function registerDDFValidation(context: vscode.ExtensionContext) {

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('jsonValidation');

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.languageId === 'json') {
                DDFValidate(document, diagnosticCollection);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'json') {
                DDFValidate(event.document, diagnosticCollection);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(document => {
            if (document.languageId === 'json') {
                DDFValidate(document, diagnosticCollection);
            }
        })
    );

    // Validate open documents on startup
    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'json') {
            DDFValidate(document, diagnosticCollection);
        }
    });
}


function DDFValidate(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {
    console.log(document);
    // const diagnostics = validateJson(document);
    // diagnosticCollection.set(document.uri, diagnostics);
}