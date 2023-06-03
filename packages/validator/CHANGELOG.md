# @deconz-community/ddf-validator

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
