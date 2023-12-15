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

#### Validator

The validator command will validate the DDFs in the given directory.
Make sure both the DDF and the Generics files are present in the directory.
You can use the flag `--no-skip` to validate the DDFs with option ddfvalidate set to false.

```bash
ddf-tools validator --help
ddf-tools validator --directory /path/to/ddf
```

#### Bundler

The bundler command will bundle the DDFs from the given json DDF source file.
Make sure the DDFs are valid before bundling them.

```bash
ddf-tools bundler --help
ddf-tools bundler --generic devices/generic/ devices/ikea/starkvind_air_purifier.json
```

##### Argument <path> (required)
The path to the json DDF source file or a directory containing the json DDF source files.
If a directory is provided, all json files in the directory will be bundled.

##### -g, --generic <path> (required)
The directory where all generic files are located.

##### -o, --output <path>
The directory where the bundled DDFs will be saved.
Defaults to the DDF directory.

##### --no-validate
Skip the validation of the DDFs.

##### --private-key <privateKey>
The private key to sign the DDFs with.

##### --upload
Upload the DDFs to the DDF server.
Currently no public DDF server is available.
The server is still in WIP.

##### --store-url <url>
The url of the DDF server to upload the DDFs to.

##### --store-token <token>
The token to authenticate with the DDF server.
