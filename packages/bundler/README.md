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
![image](https://user-images.githubusercontent.com/845225/223543840-9da9a33d-776b-40d2-ad27-a0ce4df5bbbd.png)

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
  "version": "1.0.1",
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
  ],
  "validation": {
    "result": "error",
    "version": "2.20.0",
    "errors": [
      {
        "message": "Unrecognized key(s) in object: 'cl'",
        "path": ["subdevices", 0, "items", 6, "parse"]
      },
      {
        "message": "Unrecognized key(s) in object: 'cl'",
        "path": ["subdevices", 0, "items", 9, "parse"]
      }
    ]
  }
}
```

#### version (required)

The version of the DDF, increment it if anything change inside the DDF. Once released the content should not change if the version did not change. It's using [Semantic Versioning](https://semver.org/).

##### Example

```json
"1.0.0"
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

#### validation (optional)

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
      "path": ["subdevices", 0, "items", 6, "parse"]
    },
    {
      "message": "Unrecognized key(s) in object: 'cl'",
      "path": ["subdevices", 0, "items", 9, "parse"]
    }
  ]
}
```

##### Example skipped

```json
{
  "result": "skipped",
  "version": "2.20.0"
}
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
import { Bundle, asArray } from '@deconz-community/ddf-bundler'
import type { DDFC, TextFile } from '@deconz-community/ddf-bundler'

export async function buildFromFile(
  genericDirectory: string,
  ddfPath: string,
  getFile: (path: string) => Promise<Blob>,
): Promise<ReturnType<typeof Bundle>> {
  const bundle = Bundle()

  bundle.data.name = `${ddfPath.substring(ddfPath.lastIndexOf('/') + 1, ddfPath.lastIndexOf('.'))}.ddf`
  bundle.data.ddfc = await (await getFile(ddfPath)).text()
  const ddfc: DDFC = JSON.parse(bundle.data.ddfc)

  bundle.data.desc.product = ddfc.product

  const usedConstants: {
    manufacturers: string[]
    'device-types': string[]
  } = {
    'manufacturers': [],
    'device-types': [],
  }

  const manufacturers = asArray(ddfc.manufacturername)
  const modelid = asArray(ddfc.modelid)
  if (manufacturers.length === modelid.length) {
    for (let i = 0; i < manufacturers.length; i++) {
      if (manufacturers[i].startsWith('$MF_'))
        usedConstants.manufacturers.push(manufacturers[i])

      bundle.data.desc.device_identifiers.push([
        manufacturers[i],
        modelid[i],
      ])
    }
  }

  const filesToAdd: {
    url: string
    path: string
    type: TextFile['type']
    patch?: (data: string) => string
  }[] = []

  // Download markdown files
  if (ddfc['md:known_issues'] !== undefined) {
    for (const filePath of asArray(ddfc['md:known_issues'])) {
      filesToAdd.push({
        url: new URL(`${ddfPath}/../${filePath}`).href,
        path: filePath,
        type: 'KWIS',
      })
    }
  }

  // Download script files
  if (Array.isArray(ddfc.subdevices)) {
    ddfc.subdevices.forEach((subdevice) => {
      if (subdevice.type.startsWith('$TYPE_'))
        usedConstants['device-types'].push(subdevice.type)

      if (Array.isArray(subdevice.items)) {
        subdevice.items.forEach((item) => {
          if (item.name !== undefined) {
            const fileName = `${item.name.replace(/\//g, '_')}_item.json`
            filesToAdd.push({
              url: new URL(`${genericDirectory}/items/${fileName}`).href,
              path: `generic/${fileName}`,
              type: 'JSON',
            })
          }
          for (const [_key, value] of Object.entries(item)) {
            if (value.script !== undefined) {
              filesToAdd.push({
                url: new URL(`${ddfPath}/../${value.script}`).href,
                path: value.script,
                type: 'SCJS',
              })
            }
          }
        })
      }
    })
  }

  filesToAdd.push({
    url: new URL(`${genericDirectory}/constants.json`).href,
    path: 'generic/constants_min.json',
    type: 'JSON',
    patch(data) {
      const decoded = JSON.parse(data)
      const newData = {
        'schema': decoded.schema,
        'manufacturers': {} as Record<string, string>,
        'device-types': {} as Record<string, string>,
      }
      for (const manufacturer of usedConstants.manufacturers)
        newData.manufacturers[manufacturer] = decoded.manufacturers[manufacturer]
      for (const deviceType of usedConstants['device-types'])
        newData['device-types'][deviceType] = decoded['device-types'][deviceType]
      return JSON.stringify(newData, null, 4)
    },
  })

  await Promise.all(filesToAdd.map(async (fileToAdd) => {
    let data = await (await getFile(fileToAdd.url)).text()
    if (fileToAdd.patch !== undefined)
      data = fileToAdd.patch(data)
    bundle.data.files.push({
      type: fileToAdd.type,
      data,
      last_modified: new Date(),
      path: fileToAdd.path,
    })
  }),
  )

  bundle.data.files.sort((a, b) => {
    // Sort files by path but with generics last
    const aIsGeneric = a.path.startsWith('generic/')
    const bIsGeneric = b.path.startsWith('generic/')
    if (aIsGeneric && bIsGeneric) {
      if (a.path === 'generic/constants_min.json')
        return -1
      if (b.path === 'generic/constants_min.json')
        return 1
      return a.path.localeCompare(b.path)
    }
    if (aIsGeneric)
      return 1
    if (bIsGeneric)
      return -1
    return a.path.localeCompare(b.path)
  })

  return bundle
}


const bundle = await buildFromFile(genericDirectoryUrl.value, fileUrl.value, async (url: string) => {
  const result = await fetch(url)
  if (result.status !== 200)
    throw new Error(result.statusText)

  return await result.blob()
})
```

