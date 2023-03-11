# DDF bundled format

## General

The format is a Resource Interchange File Format (RIFF), see: https://en.wikipedia.org/wiki/Resource_Interchange_File_Format Which can store arbitrary content and more importantly can by extended easily while being backward compatible.

All multi byte values are little-endian encoded.

DDF_BUNDLE_MAGIC is ASCII "DDFB"

Each chunk is prefixed by it's tag, then the size and finnaly the data.

```
U32 'RIFF'
U32 RIFF Size
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

```
U32 'DESC'
U32 Chunk Size
Data[Size]
```

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

The english device commercial name of the device.
```
Example : "acme 2000"
```

#### product_localised (optional)

The device commercial name of the device localised indexed by the [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).

Note that the "en" name it's on `product` property.
```
Example : {
    "de": "german product name",
    "fr": "french product name",
}
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

```
U32 'DDFC'
U32 Chunk Size
Data[Size]
```

Holds the base DDF compressed with zlib.

### EXTF - External file

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

| Tag  | Description                             | Data      | Format     |
|------|-----------------------------------------|-----------|------------|
| SCJS | Javascript file for read,write or parse | Text file | javascript |
| BTNM | Button maps* WIP NOT USED               | Text file | json       |
| CHLG | Changelog                               | Text file | markdown   |
| NOTI | Informational note                      | Text file | markdown   |
| NOTW | Warning note                            | Text file | markdown   |
| KWIS | Know issue                              | Text file | markdown   |
| IMGP | Image in PNG can be used in UI          | Binary    | png        |

### SIGN - Signature

Holds one or more signatures over all previous chunks starting from `DDF_BUNDLE_MAGIC` (skip the first 8 bytes of the RIFF). The signature and public key use the secp256k1 schnorr format.
[https://paulmillr.com/noble/](https://paulmillr.com/noble/)

This chunk is always at the end of the bundle.

```
U32 'SIGN'
U32 Chunk Size
u8[64] PublicKey
u8[128] Signature
```

Number of entries is `ChunkSize / (64 + 128)`.

Signatures are very easy to handle with a few lines of code and make sure the DDF is not messed with. A DDF bundle which is submitted for testing can be promoted to stable / official by simply adding another signature in this chunk nothing else needs to be modified.

Signature can also be used when filtering for "official".
