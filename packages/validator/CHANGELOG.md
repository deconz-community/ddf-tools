# @deconz-community/ddf-validator

## 2.34.0

### Minor Changes

- ce24356: Update many dep to latest version

## 2.33.2

### Patch Changes

- fbdfba6: Fix test

## 2.33.1

### Patch Changes

- d5a4d5c: Fix deployment
- 2d137d6: Add missing test data

## 2.33.0

### Minor Changes

- 156be49: Update dependencies
- f210c3c: Update deps
- 8277393: Update deps

### Patch Changes

- 156be49: Add support for `ui_name` in sub devices
- b10b38c: Update tests files

## 2.32.0

### Minor Changes

- cafc422: Update deps

## 2.31.1

### Patch Changes

- 787d3fa: Update dependencies

## 2.31.0

### Minor Changes

- c3f7666: Change bundle extension to .ddb

### Patch Changes

- d65998c: Update deps

## 2.30.2

### Patch Changes

- 7b6c3d1: Update deps

## 2.30.1

### Patch Changes

- c771904: Update deps

## 2.30.0

### Minor Changes

- dea07d6: Add support for md:type files

### Patch Changes

- 6458a23: Update deps

## 2.29.0

### Minor Changes

- 130ee4c: Update deps

## 2.28.0

### Minor Changes

- 15bf579: Update deps

## 2.27.2

### Patch Changes

- 189f8e3: Fix exports

## 2.27.1

### Patch Changes

- 795d4b9: Fix type import

## 2.27.0

### Minor Changes

- 65675dc: Update dependencies

## 2.26.0

### Minor Changes

- 36cceed: Allow fc option in all zcl commands

## 2.25.0

### Minor Changes

- 1dc2e49: Added support for "any" cmd

## 2.24.0

### Minor Changes

- 2b94b81: Update deps

## 2.23.0

### Minor Changes

- 39d9a6a: Update dependencies
- a495fb5: Add typing for isGeneric and isDDF methods

## 2.22.0

### Minor Changes

- b90de1f: Add type definition for bulkValidate
- 42f7b9e: Updated dependencies

## 2.21.0

### Minor Changes

- 61e073a: Updated dependencies

## 2.20.0

### Minor Changes

- 71ba19c: Add support for ddfvalidate option

## 2.19.0

### Minor Changes

- f5fac8a: Add bulkValidate method
- 17ee8d9: Remove deprecated 'zcl' function
- ca2a878: Refactor read/parse/write functions validation

### Patch Changes

- 17ee8d9: Fix refresh interval check not checking the zcl:attr functions

## 2.18.0

### Minor Changes

- ccf18af: Add validation for srcitem of numtostr parse function

## 2.17.0

### Minor Changes

- d838cc7: Add isDDF method to check if a schema is a DDF file
- fde89a1: Updated dependencies

### Patch Changes

- 61fbd9c: Update test files

## 2.16.0

### Minor Changes

- fdb6713: Add isGeneric method to check if a schema is a generic file

## 2.15.0

### Minor Changes

- 787e62c: Update zcl:cmd schema

## 2.14.0

### Minor Changes

- cee8426: Add more rules for items of light devices

### Patch Changes

- 614fe94: Cleanup old rule
- 657e77f: Fix rules being ignored when there were no bindings

## 2.13.0

### Minor Changes

- 42ef6e2: Reduce enum errors message length

## 2.12.1

### Patch Changes

- 50abb20: Add missing type definition

## 2.12.0

### Minor Changes

- f5c02f4: Validate DDF against subdevice generics

## 2.11.0

### Minor Changes

- c20fd0b: Add requirement of state/open to ZHAOpenClose devices
- c20fd0b: Update test data

## 2.10.0

### Minor Changes

- ce1135a: Add Double as datatype

## 2.9.0

### Minor Changes

- 195b55e: Updated dependencies
- c1ce019: Update pnpm to version 8

## 2.8.0

### Minor Changes

- f4cc735: Add support for schema constants2.schema.json

## 2.7.1

### Patch Changes

- 60fa97a: Fix type definition generation

## 2.7.0

### Minor Changes

- 956a9df: Replace signature package @noble/curves

## 2.6.0

### Minor Changes

- 6139347: Updated dependencies to latest version

## 2.5.0

### Minor Changes

- 2338229: Add store related fields

### Patch Changes

- 7f8c7c4: Updated dependencies

## 2.4.0

### Minor Changes

- 2913fd0: Ignore binding with value 65535

## 2.3.0

### Minor Changes

- cbf5b50: loadGeneric method now return true on success
- cbf5b50: Revert to node16
- 21c0245: Update test files
- 1b0d44e: Add MF property for xiaomi:special parse function

## 2.2.1

### Patch Changes

- 883ae17: Fix type definition

## 2.2.0

### Minor Changes

- f860dd6: Add refine validation for parse/write method to have eval or script property
- 4309e3d: Update validation of at parse property to accept arrays
- e136c9d: Add support for zcl:attr and zcl:cmd functions
- 8e57888: Updated dependencies
- 2c8843d: Update tests files

### Patch Changes

- 4ea2e78: Updated dependencies

## 2.1.0

### Minor Changes

- e5bbb36: Add test for validating ManufacturerName and ModelID properties to be both string or same length array
- a8eb1b0: Add validation for bindings report.min <= report.max
- ed7141f: Add some descriptions
- 7ece669: The at attributes for read function are now mandatory
- f9665e9: Now the eval and script can't be used at the same time on a function.
- 28ab354: Add validation to check the refresh interval against the related binding
- b01a71b: Update manufacturer and type to accept strings not defined in constants.json

## 2.0.0

### Major Changes

- c57e7d3: Rework validator to load generic data

### Minor Changes

- ec49367: Update string validator for date and hexa values

## 1.3.0

### Minor Changes

- 438f516: Update attribute name validation
- 1e1d964: Update device item name validation to use the attributes list from ressource.cpp
- d1a3188: Add validator for generic files

## 1.2.0

### Minor Changes

- d39099f: update ddf test files

## 1.1.0

### Minor Changes

- 1837473: Add cppsrc parsing option

## 1.0.0

### Major Changes

- 03f1d37: First release

### Minor Changes

- e192695: Add typescript and json schema definition
- 1c07ad1: Update test files from main repo

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
