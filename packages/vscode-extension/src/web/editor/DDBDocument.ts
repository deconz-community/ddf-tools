import type { BundleData } from '@deconz-community/ddf-bundler'
import { decode, generateHash } from '@deconz-community/ddf-bundler'
import { bytesToHex } from '@noble/hashes/utils.js'

import * as vscode from 'vscode'

type BundleObject = Awaited<ReturnType<typeof decode>>

export class DDBDocument implements vscode.CustomDocument {
  static async create(uri: vscode.Uri): Promise<DDBDocument> {
    const rawData = await vscode.workspace.fs.readFile(uri)
    const bundle = await decode(new Blob([rawData]))
    return new DDBDocument(uri, rawData, bundle)
  }

  private readonly _uri: vscode.Uri
  private _rawData: Uint8Array
  private _bundle: BundleObject
  private readonly _onDidDispose = new vscode.EventEmitter<void>()

  private constructor(uri: vscode.Uri, _rawData: Uint8Array, bundle: BundleObject) {
    this._uri = uri
    this._rawData = _rawData
    this._bundle = bundle
  }

  public get uri(): vscode.Uri {
    return this._uri
  }

  public get bundleData(): BundleData {
    return this._bundle.data
  }

  public async getHash(forceRecompute = false): Promise<string> {
    if (forceRecompute || !this._bundle.data.hash) {
      this._bundle.data.hash = await generateHash(this._bundle.data)
    }
    return bytesToHex(this._bundle.data.hash)
  }

  dispose(): void {
    this._onDidDispose.fire()
    this._onDidDispose.dispose()
  }

  public readonly onDidDispose = this._onDidDispose.event
}
