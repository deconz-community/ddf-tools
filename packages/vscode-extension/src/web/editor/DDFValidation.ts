import { createValidator } from '@deconz-community/ddf-validator'
import { createScanner, getLocation, SyntaxKind } from 'jsonc-parser'
import * as vscode from 'vscode'

function getJsonPath(document: vscode.TextDocument, position: vscode.Position) {
  const text = document.getText()
  const offset = document.offsetAt(position)
  const scanner = createScanner(text, true)

  return getLocation(text, offset)
}

export async function registerDDFValidation(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('jsonValidation')
  const validators = {
    root: createValidator(),
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => validate(document, diagnosticCollection)),
    vscode.workspace.onDidSaveTextDocument(document => validate(document, diagnosticCollection)),
    vscode.workspace.onDidChangeTextDocument(({ document }) => validate(document, diagnosticCollection)),
  )

  // Validate open documents on startup
  vscode.workspace.textDocuments.forEach(document => validate(document, diagnosticCollection))

  /*
  // https://code.visualstudio.com/Docs/editor/editingevolved#_inlay-hints
  vscode.languages.registerInlayHintsProvider('json', {
    provideInlayHints: async (model, range, token) => {
      console.log('provideInlayHints', model, range, token)
      return null
    },
  })
  */

  /*
  vscode.languages.registerHoverProvider('json', {
    provideHover(document, position, _token) {
      const location = getLocation(document.getText(), document.offsetAt(position))
      if (!location.isAtPropertyKey)
        return

      console.log(validators.root.getSchema())
      console.log(location)

      return null
    },
  })
  */

  async function validate(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {
    if (document.languageId !== 'json')
      return

    console.log('DDFValidate')

    console.log(document.version)

    diagnosticCollection.set(document.uri, [
      /*
      new vscode.Diagnostic(
        new vscode.Range(1, 0, 1, Number.MAX_SAFE_INTEGER),
        'DDF validation is not implemented yet',
        vscode.DiagnosticSeverity.Warning,
      ),
      */
    ])
  }
}
