# Command line tool

A command line tool for working with DDFs.

## Installation

```bash
npm install -g @deconz-community/cli
```

## Usage

## With install

```bash
ddf-tools --help
```

## Without install (run slower)

```bash
npx @deconz-community/cli --help
```

## From the source

```bash
pnpm preview --help
```

### Help

You can see the help by running:
```bash
ddf-tools --help
```

### Commands

#### Validate

The validate command will validate the DDFs in the given directory.
Make sure both the DDF and the Generics files are present in the directory.
You can use the flag `--no-skip` to validate the DDFs with option ddfvalidate set to false.

```bash
ddf-tools validate --help
ddf-tools validate --directory /path/to/ddf
```

#### Bundle

The bundle command will bundle the DDFs from the given json DDF source file.
Make sure the DDFs are valid before bundling them.

```bash
ddf-tools bundle --help
ddf-tools bundle -o ./output/ devices/ikea/starkvind_air_purifier.json
ddf-tools bundle -o ./output/ devices/
ddf-tools bundle --upload --store-token <token> devices/
```

##### Argument <path> (required)
The path to the json DDF source file or a directory containing the json DDF source files.
If a directory is provided, all json files in the directory will be bundled.

##### -g, --generic <path>
The directory where all generic files are located.
If not provided, the bundler will look for the generic directory in parent directories.

##### -o, --output <path>
The directory where the bundled DDFs will be saved.
Defaults to the DDF directory.

##### --no-validate
Skip the validation of the DDFs.

##### --private-key <privateKey>
The private key to sign the DDFs with. If upload enabled your private key will be used to sign the DDFs.

##### --upload
Upload the DDFs to the DDF server.

##### --store-url <url>
The url of the DDF server to upload the DDFs to. By default it's using the global DDF server at https://ddf.cryonet.io.

##### --store-token <token>
The token to authenticate with the DDF server.

##### --store-bundle-status <status>
Status of the bundle (alpha, beta, stable) (default: "alpha")

##### --file-modified-method <method>
Method to use to get the last modified date of the files (gitlog, mtime, ctime) (default: "gitlog")

##### --debug
Enable debug mode.

#### Bulk operations

The bulk command will run various operation on DDF files.

##### uuid operation

The uuid operation will generate a new UUID for each DDF file in the given directory.
Limited to 100 files at a time.

```bash
ddf-tools bulk uuid --store-token <token> ./devices/
```
