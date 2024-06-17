# @deconz-community/ddf-bundler

## 0.29.0

### Minor Changes

- c3f7666: Change bundle extension to .ddb

### Patch Changes

- d65998c: Update deps

## 0.28.1

### Patch Changes

- 7b6c3d1: Update deps

## 0.28.0

### Minor Changes

- c771904: Add vendor to DESC chunk

### Patch Changes

- c771904: Removed matchexpr
- c771904: Update deps

## 0.27.1

### Patch Changes

- 00bc052: Removed ddf extension in the name

## 0.27.0

### Minor Changes

- 4056798: Add deprecated public key

## 0.26.0

### Minor Changes

- dea07d6: Add support for md:type files

### Patch Changes

- 6458a23: Update deps

## 0.25.0

### Minor Changes

- 0df88f3: Add matchexpr to DESC

## 0.24.0

### Minor Changes

- 44f03b0: DDFC file is now in the EXTF chunk

## 0.23.0

### Minor Changes

- c8d3b3b: Add stable and beta public key

## 0.22.0

### Minor Changes

- 130ee4c: Added `ddfc_last_modified` property in the desc chunk. It's the raw JSON file modified date.
- 130ee4c: Changed the `last_modified` calculation for desc chunk. It's now the latest modified file in the bundle.
- 130ee4c: Update deps
- 6abf6fa: Add test
- 130ee4c: Removed pako dependency
- 130ee4c: Removed unused file types
- 6abf6fa: Add support for optional EXTF modification time

## 0.21.0

### Minor Changes

- 6c6537b: Use main modified date for constants file

## 0.20.0

### Minor Changes

- 8695f5d: Update buildFromFiles to use cache for sources
- 15bf579: Update deps

## 0.19.0

### Minor Changes

- 6ce07b3: Rework ValidationError schema

## 0.18.1

### Patch Changes

- 608cb03: Fix getLastModified method

## 0.18.0

### Minor Changes

- 1f37211: Add getLastModified param to builder

## 0.17.0

### Minor Changes

- 81d4fb9: Update ValidationResult type definition

## 0.16.0

### Minor Changes

- 65675dc: Update dependencies

## 0.15.1

### Patch Changes

- 1eb62ea: Fixed last modified date decoding

## 0.15.0

### Minor Changes

- 2b94b81: Update deps

## 0.14.0

### Minor Changes

- 52f0ed0: Add buildFromFiles method
- 39d9a6a: Update dependencies

### Patch Changes

- d4adb19: Code cleanup for the builder

## 0.13.0

### Minor Changes

- 2e42535: Added support for the VALI chunk
- 42f7b9e: Updated dependencies

## 0.12.0

### Minor Changes

- 61e073a: Updated dependencies

## 0.11.0

### Minor Changes

- fce576f: Split hash and signature methods
- fde89a1: Updated dependencies

## 0.10.0

### Minor Changes

- 195b55e: Updated dependencies
- c1ce019: Update pnpm to version 8

### Patch Changes

- 3190955: Fix DESC method

## 0.9.0

### Minor Changes

- f4cc735: Add support for schema constants2.schema.json

## 0.8.0

### Minor Changes

- 515f2b9: Add generate DESC method

## 0.7.0

### Minor Changes

- 956a9df: Replace signature package @noble/curves

## 0.6.0

### Minor Changes

- 6139347: Updated dependencies to latest version

## 0.5.2

### Patch Changes

- 373b496: Fix tests

## 0.5.1

### Patch Changes

- 7f8c7c4: Updated dependencies

## 0.5.0

### Minor Changes

- 42c9f92: Add tests
- 8e57888: Updated dependencies

### Patch Changes

- 4ea2e78: Updated dependencies

## 0.4.1

### Patch Changes

- 6127a24: Fix decoding of JSON external files

## 0.4.0

### Minor Changes

- 2554130: Move builder from bundler to playground
- 2554130: Add JSON generic files

## 0.3.0

### Minor Changes

- ae64798: Disable chunk compression
- 74491cf: Update playground UI for signatures

### Patch Changes

- fb4ef94: Signature are now against the complete DDFB chunk with tag and size

## 0.2.2

### Patch Changes

- 7a63ef9: Fix signature encoder

## 0.2.1

### Patch Changes

- 27817cb: Cleanup build

## 0.2.0

### Minor Changes

- 09bd4a0: Change build to be ES and CJS

## 0.1.1

### Patch Changes

- Cleanup build

## 0.1.0

### Minor Changes

- update dist file paths

## 0.0.1

### Patch Changes

- 65d9e75: Initial version
