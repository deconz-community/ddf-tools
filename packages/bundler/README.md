# DDF bundler

## General

The format is a Resource Interchange File Format (RIFF), see: https://en.wikipedia.org/wiki/Resource_Interchange_File_Format Which can store arbitrary content and more importantly can by extended easily while being backward compatible.

All multi byte values are little-endian encoded.

DDF_BUNDLE_MAGIC is ASCII "DDFB"

Each chunk is prefixed by it's tag, then the size and finnaly the data.

```
U32 'RIFF'
U32 RIFF Size
U32 DDF_BUNDLE_MAGIC
U32 DDF_Bundle Size
U32 Chunk Tag
U32 Chunk Size
Data[Size]
....
U32 Chunk Tag
U32 Chunk Size
Data[Size]
```

The file can be see as a tree structure.

Visual representation of the DDF split by chunks

![DDF_bundle_format.png](DDF_bundle_format.png)

## Chunks

### DDFB.DESC - Descriptor - unique

```
U32 'DESC'
U32 Chunk Size
Data[Size]
```

This is always the first chunk and allows fast indexing and matching without parsing the whole DDF. It's a JSON file.

```json
{
  "source": "https://deconz-community.github.io/ddf-store/XXXX/XXXX",
  "last_modified": "2023-01-08T17:24:24z",
  "version_deconz": ">2.19.3",
  "product": "acme 2000",
  "links": [
    "url-to-forum-entry",
    "url-to-github-entry"
  ],
  "device_identifiers": [
    ["Philips", "acme 2000"],
    ["Signify", "acme 200"]
  ]
}
```

#### source (optional)

The URL of the DDF page on the store, could be used to update DDF.

##### Example

```json
"https://deconz-community.github.io/ddf-store/XXXX/XXXX"
```

#### last_modified (required)

The last modified date of the bundle in a complete date plus hours ISO 8601 format.

##### Example

```json
"2023-01-08T17:24:24z"
```

#### version_deconz (required)

The minimum version for Deconz. It's using [Semantic Versioning](https://semver.org/) with version comparaison. See [Semver Calculator](https://semver.npmjs.com/) for example.

##### Example

```json
">2.20.1"
```

#### product (required)

The english device commercial name of the device.

##### Example

```json
"acme 2000"
```

#### product_localised (optional)

The device commercial name of the device localised indexed by the [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).

Note that the "en" name it's on `product` property.

##### Example

```json
{
  "de": "german product name",
  "fr": "french product name"
}
```

#### links (optional)

Any link usefull about this bundle, can be issue link, forum link, device official web page

##### Example

```json
[
  "url-to-forum-entry",
  "url-to-github-entry"
]
```

#### device_identifiers (required)

The list of device identifier, it's generated from each combinaison of `manufacturername` and `modelid` from the DDF.

##### Example

```json
[
  ["Philips", "acme 2000"],
  ["Signify", "acme 200"]
]
```

### DDFB.DDFC - DDF JSON (compressed) - unique

```
U32 'DDFC'
U32 Chunk Size
Data[Size]
```

Holds the base DDF compressed with zlib.

### DDFB.EXTF - External file - multiple

```
U32 'EXTF'
U32 FileType (see below)
U16 PathLength
U8 [PathLength] filepath
U16 ModificationTimeLength
U8 [ModificationTimeLength] ModificationTime in ISO 8601 format
U32 FileSize
U8 Data[FileSize]
```

#### FileType

FileType is a tag to know what kind of file the chunk contain.

For Text file they are all compressed using zlib.

| Tag  | Description                              | Data      | Format     |
|------|------------------------------------------|-----------|------------|
| SCJS | Javascript file for read, write or parse | Text file | javascript |
| JSON | Generic files for items / constants      | Text file | json       |
| BTNM | Button maps* WIP NOT USED                | Text file | json       |
| CHLG | Changelog                                | Text file | markdown   |
| NOTI | Informational note                       | Text file | markdown   |
| NOTW | Warning note                             | Text file | markdown   |
| KWIS | Know issue                               | Text file | markdown   |
| IMGP | Image in PNG can be used in UI           | Binary    | png        |

### DDFB.VALI - DDF Validation result - unique - optional

The result of the validation using the ddf-validator. It's a JSON object.
If there is no errors the `errors` property is omitted.

`result` can be `success`, `error` or `skipped`.

##### Example success

```json
{
  "result": "success",
  "version": "2.20.0"
}
```

##### Example error

```json
{
  "result": "error",
  "version": "2.20.0",
  "errors": [
    {
      "message": "Unrecognized key(s) in object: 'cl'",
      "path": ["generic/items/state_airquality_item.json", "subdevices", 0, "items", 6, "parse"]
    },
    {
      "message": "Unrecognized key(s) in object: 'cl'",
      "path": ["ddf.json", "subdevices", 0, "items", 9, "parse"]
    }
  ]
}
```

##### Example skipped

Used when the flag `ddfvalidate` is set to false in the DDFC.

```json
{
  "result": "skipped",
  "version": "2.20.0"
}
```

### SIGN - Signature - multiple

Signatures are very easy to handle with a few lines of code and make sure the DDF is not messed with. A DDF bundle which is submitted for testing can be promoted to stable / official by simply adding another signature in this chunk nothing else needs to be modified.

Holds one signature over the `DDF_BUNDLE_MAGIC` chunk. The signature and public key use the secp256k1 ECDSA format.
[https://paulmillr.com/noble/](https://paulmillr.com/noble/)

```
U32 'SIGN'
U32 Chunk Size
U16 PublicKey Length
U8 [PublicKey Length] PublicKey
U16 Signature Length
U8 [Signature Length] Signature
```

Thoses chunk are always at the end of the bundle and not inside the DDFB chunk.

## Example usage

### Decoding a bundle
```typescript
import { decode } from '@deconz-community/ddf-bundler'
import { readFile } from 'fs/promises'

const data = await readFile(path.join(__dirname, 'ddf/aq1_vibration_sensor.ddf'))
const blob = new Blob([data])
blob.name = 'aq1_vibration_sensor.ddf'

const bundle = await decode(blob)
```

### Encoding a bundle
```typescript
import { Bundle, encode } from '@deconz-community/ddf-bundler'

const bundle = Bundle()

bundle.data.name = 'sample.ddf'
bundle.data.desc.product = 'Sample product'
bundle.data.ddfc = '{"schema": "devcap1.schema.json"}'
bundle.data.files.push({
  type: 'JSON',
  data: JSON.stringify({ foo: 'bar' }),
  path: 'foo.json',
  last_modified: new Date(),
})

const encoded = encode(bundle)
```

### Building a bundle from files
```typescript
import { buildFromFiles } from '@deconz-community/ddf-bundler'

const bundle = await buildFromFiles(genericDirectoryUrl.value, fileUrl.value, async (url: string) => {
  const result = await fetch(url)
  if (result.status !== 200)
    throw new Error(result.statusText)

  return await result.blob()
})
```
