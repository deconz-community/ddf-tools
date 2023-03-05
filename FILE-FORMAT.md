# DDF bundled format

## General

The format is a Resource Interchange File Format (RIFF), see: https://en.wikipedia.org/wiki/Resource_Interchange_File_Format Which can store arbitrary content and more importantly can by extended easily while being backward compatible.

All multi byte values are little-endian encoded.

DDF_BUNDLE_MAGIC is ASCII "DDFB"

Each chunk is prefixed by it's tag, then the size and finnaly the data.

```
U32 DDF_BUNDLE_MAGIC
U32 Chunk Tag
U32 Chunk Size
Data[Size]
....
U32 Chunk Tag
U32 Chunk Size
Data[Size]
```

## Chunks

### DESC - Descriptor

Tag: "DESC"

This is always the first chunk and allows fast indexing and matching without parsing the whole DDF. It's a JSON file.

```json
{
  "last_modified": "2023-01-08T17:24:24z",
  "version": "1.0.1",
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

#### last_modified (required)

The last modified date of the bundle in a complete date plus hours ISO 8601 format.
```
Example : "2023-01-08T17:24:24z"
```

#### version (required)

The version of the DDF, increment it if anything change inside the DDF. Once released the content should not change if the version did not change. It's using [Semantic Versioning](https://semver.org/).
```
Example : "1.0.0"
```

#### version_deconz (required)

The minimum version for Deconz. It's using [Semantic Versioning](https://semver.org/) with version comparaison. See [Semver Calculator](https://semver.npmjs.com/) for example.
```
Example : ">2.20.1"
```

#### product (required)

The device commercial name of the device.
```
Example : "acme 2000"
```

#### links (optional)

Any link usefull about this bundle, can be issue link, forum link, device official web page
```
Example : [
  "url-to-forum-entry",
  "url-to-github-entry"
]
```
#### device_identifiers (required)

The list of device identifier, it's generated from each combinaison of `manufacturername` and `modelid` from the DDF.

```
Example : [
  ["Philips", "acme 2000"],
  ["Signify", "acme 200"]
]
```

### DDFC - DDF JSON (compressed)

Tag: "DDFC"

Holds the base DDF compressed with zlib.

### EXTF - External file

Tag: "EXTF"

```
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

| Tag  | Description                             | Data      | Format     |
|------|-----------------------------------------|-----------|------------|
| SCJS | Javascript file for read,write or parse | Text file | javascript |
| BTNM | Button maps                             | Text file | json       |
| CHLG | Changelog                               | Text file | markdown   |
| NOTI | Informational note                      | Text file | markdown   |
| NOTW | Warning note                            | Text file | markdown   |
| KWIS | Know issue                              | Text file | markdown   |
| UBIN | Update binary for OTA                   | Binary    |            |
| IMAG | Image can be used in UI                 | Binary    |            |

### SIGN - Signature

Holds one or more signatures over all previous chunks. The signature and public key use the secp256k1 elliptic curve format.

```
u8[32] PublicKey
u8[64] Signature
```

Number of entries is `ChunkSize / (32 + 64)`.

Signatures are very easy to handle with a few lines of code and make sure the DDF is not messed with. A DDF bundle which is submitted for testing can be promoted to stable / official by simply adding another signature in this chunk nothing else needs to be modified.

Signature can also be used when filtering for "official".
