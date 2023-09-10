# @deconz-community/ddf-validator

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

- 195b55e: Update deps
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

- 6139347: Update deps to latest version

## 2.5.0

### Minor Changes

- 2338229: Add store related fields

### Patch Changes

- 7f8c7c4: Update deps

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
- 8e57888: Update deps
- 2c8843d: Update tests files

### Patch Changes

- 4ea2e78: Update deps

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
