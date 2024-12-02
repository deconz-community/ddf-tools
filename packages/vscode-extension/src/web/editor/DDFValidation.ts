import { createValidator } from '@deconz-community/ddf-validator'
import * as vscode from 'vscode'

import { zodToJsonSchema } from 'zod-to-json-schema'

export async function registerDDFValidation(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('jsonValidation')
  const validators = {
    root: createValidator(),
  }

  const schema = zodToJsonSchema(validators.root.getSchema())

  vscode.languages.registerDeclarationProvider('json', {
    provideDeclaration(document, position, token) {
      console.log('provideDeclaration', document, position, token)
      return null
    },
  })

  vscode.languages.registerHoverProvider('json', {
    provideHover(document, position, token) {
      // console.log('provideHover', document, position, token)
      return null
    },
  })

  console.log('foooo')
  console.log(vscode.languages)
  console.log('bar')

  /*
  vscode.languages.json.setDiagnosticsOptions({
    ...languages.json.jsonDefaults.diagnosticsOptions,
    validate: true,
    schemas: [{
      uri: '',
      fileMatch: ['*.json'],
      schema: schema.value,
    }],
  })
    */

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === 'json') {
        validate(document, diagnosticCollection)
      }
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'json') {
        validate(event.document, diagnosticCollection)
      }
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.languageId === 'json') {
        validate(document, diagnosticCollection)
      }
    }),
  )

  // Validate open documents on startup
  vscode.workspace.textDocuments.forEach((document) => {
    if (document.languageId === 'json') {
      validate(document, diagnosticCollection)
    }
  })

  /*
  vscode.languages.registerInlayHintsProvider('json', {
    provideInlayHints: async (model, range, token) => {
      console.log('provideInlayHints', model, range, token)
      return null
    },
  })
  */
}

function validate(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {
  // console.log('DDFValidate')
  // console.log(document)
  // const diagnostics = validateJson(document);
  // diagnosticCollection.set(document.uri, diagnostics);
}
