import type { JSONSchema } from 'vscode-json-languageservice'
import type { InitializeParams } from 'vscode-languageserver/browser'
import { createValidator } from '@deconz-community/ddf-validator'
import { getLanguageService } from 'vscode-json-languageservice'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BrowserMessageReader, BrowserMessageWriter, createConnection, TextDocuments, TextDocumentSyncKind } from 'vscode-languageserver/browser'
import { zodToJsonSchema } from 'zod-to-json-schema'

console.log('running server lsp-web-extension-sample')

const messageReader = new BrowserMessageReader(globalThis as any)
const messageWriter = new BrowserMessageWriter(globalThis as any)
const connection = createConnection(messageReader, messageWriter)

const documents = new TextDocuments(TextDocument)

const jsonLanguageService = getLanguageService({})

const validator = createValidator()
const schema = zodToJsonSchema(validator.getSchema())

jsonLanguageService.configure({
  schemas: [{
    uri: 'ddfc://schemas/ddf-schema.json',
    fileMatch: ['*.json'],
    schema: schema as JSONSchema,
  }],
})

/* from here on, all code is non-browser specific and could be shared with a regular extension */
connection.onInitialize((_params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: false,
      },
      hoverProvider: true,
      /*
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
      */
    },
  }
})

// jsonLanguageService.doValidation()

connection.onHover(async (textDocumentPosition, _token) => {
  const document = documents.get(textDocumentPosition.textDocument.uri)
  if (!document)
    return null

  return jsonLanguageService.doHover(
    document,
    textDocumentPosition.position,
    jsonLanguageService.parseJSONDocument(document),
  )
})

connection.onCompletion(async (textDocumentPosition, _token) => {
  const document = documents.get(textDocumentPosition.textDocument.uri)
  if (!document)
    return null

  return jsonLanguageService.doComplete(
    document,
    textDocumentPosition.position,
    jsonLanguageService.parseJSONDocument(document),
  )
})

documents.listen(connection)
connection.listen()
