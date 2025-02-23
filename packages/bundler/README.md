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
  "uuid": "331012bd-ce22-4a1b-9f4a-d092aa2cca92",
  "product": "Hue white and color ambiance gradient light",
  "version_deconz": ">2.27.0",
  "last_modified": "2024-05-05T14:07:12.000Z",
  "device_identifiers": [
    [
      "Signify Netherlands B.V.",
      "LCX001"
    ]
  ]
}
```

#### uuid (required)

The UUID of the DDF, it's a unique identifier for the DDF.

##### Example

```json
"331012bd-ce22-4a1b-9f4a-d092aa2cca92"
```

#### vendor (required)

The english device commercial name of the vendor.

##### Example

```json
"Hue white and color ambiance gradient light"
```

#### product (required)

The english device commercial name of the device.

##### Example

```json
"Hue white and color ambiance gradient light"
```

#### version_deconz (required)

The minimum version for Deconz. It's using [Semantic Versioning](https://semver.org/) with version comparaison. See [Semver Calculator](https://semver.npmjs.com/) for example.

##### Example

```json
">2.27.0"
```

#### last_modified (required)

The lastest modified date of any file of the bundle in a complete date plus hours ISO 8601 format.

##### Example

```json
"2024-05-05T14:07:12.000Z"
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

### DDFB.EXTF - External file - multiple

```
U32 'EXTF'
U32 FileType (see below)
U16 PathLength
U8 [PathLength] Filepath
U16 ModificationTimeLength
U8 [ModificationTimeLength] ModificationTime in ISO 8601 format
U32 FileSize
U8 Data[FileSize]
```

See [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) for the date format.

#### FileType

FileType is a tag to know what kind of file the chunk contain.

| Tag  | Description                              | Data      | Format     |
|------|------------------------------------------|-----------|------------|
| DDFC | DDF JSON file (devcap1.schema.json)      | Text file | json       |
| JSON | Generic files for items / constants      | Text file | json       |
| SCJS | Javascript file for read, write or parse | Text file | javascript |
| CHLG | Changelog                                | Text file | markdown   |
| INFO | Informational note                       | Text file | markdown   |
| WARN | Warning note                             | Text file | markdown   |
| KWIS | Know issue                               | Text file | markdown   |
<!--
| BTNM | Button maps* WIP NOT USED                | Text file | json       |
| IMGP | Image in PNG can be used in UI           | Binary    | png        |
-->

#### FilePath

The file name of the path must be unique in the bundle. You can use the same file name in different directories.

The path of the file in the bundle. There is 2 types of path, `Repository` and `DDF Relative`.

The `Repository` path is the absolute path of the file from the GitHub repository from the (devices directory)[https://github.com/dresden-elektronik/deconz-rest-plugin/tree/master/devices].
For example `deconz-rest-plugin/devices/tuya/ZY-M100_human_breathing_presence.json` became `tuya/ZY-M100_human_breathing_presence.json` once bundled.

The `DDF Relative` path is the path exactly how they are written in the DDF json file. It's always relative to the path of the DDF json file.
For example if the DDF json file contain :
```json
{
  "parse": {
    "dpid": 104,
    "script": "../generic/illuminance_cluster/lux_to_lightlevel.js",
    "fn": "tuya"
  }
}
```
The path of the file on the disk is `deconz-rest-plugin/devices/generic/illuminance_cluster/lux_to_lightlevel.js` and became `../generic/illuminance_cluster/lux_to_lightlevel.js` once bundled.

##### Path format by FileType

<!--
deConz way to load file;
- DDFC Path is not used;
- JSON Path
  - Check for the constants2.schema.json value
  - Load all files that start with generic/items
- SCJS Just compare the file name with the DDF definition
- Any other file type is not used
-->

| Tag  | Path format  | Example                                               |
|------|--------------|-------------------------------------------------------|
| DDFC | Repository   | `tuya/ZY-M100_human_breathing_presence.json`          |
| JSON | Repository   | `generic/items/attr_id_item.json`                     |
| SCJS | DDF Relative | `../generic/illuminance_cluster/lux_to_lightlevel.js` |
| CHLG | DDF Relative | `ZY-M100_changelog.md`                                |
| INFO | DDF Relative | `ZY-M100_info.md`                                     |
| WARN | DDF Relative | `ZY-M100_warning.md`                                  |
| KWIS | DDF Relative | `ZY-M100_known_issues.md`                             |

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
      "type": "simple",
      "message": "Missing file 'warning.md'."
    },
    {
      "type": "validation",
      "message": "Unrecognized key(s) in object: 'cl'",
      "path": ["subdevices", 0, "items", 6, "parse"],
      "file": "generic/items/state_airquality_item.json",
      "line": 40,
      "column": 5
    },
    {
      "type": "validation",
      "message": "Unrecognized key(s) in object: 'cl'",
      "file": "ddf.json",
      "path": ["subdevices", 0, "items", 9, "parse"],
      "line": 40,
      "column": 5
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
import { readFile } from 'node:fs/promises'
import { decode } from '@deconz-community/ddf-bundler'

const data = await readFile(path.join(__dirname, 'ddf/aq1_vibration_sensor.ddb'))
const blob = new Blob([data])
blob.name = 'aq1_vibration_sensor'

const bundle = await decode(blob)
```

### Encoding a bundle
```typescript
import { Bundle, encode } from '@deconz-community/ddf-bundler'

const bundle = Bundle()

bundle.data.name = 'sample'
bundle.data.desc.product = 'Sample product'
bundle.data.files.push({
  type: 'DDFC',
  data: '{"schema": "devcap1.schema.json"}',
  path: 'ddf.json',
  last_modified: new Date(),
})
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
import { buildFromFiles, createSource } from '@deconz-community/ddf-bundler'

const bundle = await buildFromFiles(
  `file://${genericDirectoryPath}`,
  `file://${inputFilePath}`,
  async (path) => {
    if (sources.has(path))
      return sources.get(path)!
    const filePath = path.replace('file://', '')
    const data = await fs.readFile(filePath)
    const source = createSource(new Blob([data]), {
      path,
      last_modified: (await fs.stat(filePath)).mtime,
    })
    sources.set(path, source)
    return source
  },
)
```
