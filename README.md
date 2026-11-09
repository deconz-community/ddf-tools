# DDF Tools

Tools to validate, bundle, sign and share [deCONZ](https://github.com/dresden-elektronik/deconz-rest-plugin) Device Description Files (DDF).

The toolbox is online at <https://deconz-community.github.io/ddf-tools/>.

## Packages

| Path                                                     | Package                                                           | Description                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`apps/toolbox`](apps/toolbox)                           | —                                                                 | Web app: bundle editor, store browser and upload, gateway management    |
| [`apps/store`](apps/store)                               | —                                                                 | DDF store service: accounts, bundle uploads, signatures (Hono + SQLite) |
| [`packages/cli`](packages/cli)                           | [`@deconz-community/cli`](packages/cli)                           | `ddf-tools` command: validate, bundle, sign and upload DDFs             |
| [`packages/validator`](packages/validator)               | [`@deconz-community/ddf-validator`](packages/validator)           | Zod schemas to validate DDF files                                       |
| [`packages/bundler`](packages/bundler)                   | [`@deconz-community/ddf-bundler`](packages/bundler)               | Read, write and sign DDF bundles (`.ddb`); documents the bundle format  |
| [`packages/store-api-client`](packages/store-api-client) | [`@deconz-community/store-api-client`](packages/store-api-client) | Typed client for the store API                                          |
| [`packages/rest-client`](packages/rest-client)           | not published                                                     | Typed client for the deCONZ REST API                                    |
| [`packages/vscode-extension`](packages/vscode-extension) | not published                                                     | VS Code web extension to open `.ddb` files (work in progress)           |

## Development

Requires [Vite+](https://viteplus.dev/guide/) (`vp`), which installs the right Node.js and pnpm versions. A dev container is provided.

```sh
git clone --recurse-submodules https://github.com/deconz-community/ddf-tools.git
cd ddf-tools
vp install
```

The `lib/deconz-rest-plugin` submodule provides the DDF files used by the validator tests.

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `vp run dev:toolbox`   | Toolbox on <http://localhost:4000>               |
| `vp run dev:store`     | Store API on <http://localhost:3000> (see below) |
| `vp run dev:extension` | VS Code extension in a browser                   |
| `vp run -r build`      | Build every package                              |
| `vp test`              | Run the tests                                    |
| `vp check`             | Format, lint and type check                      |

The store reads its configuration from `apps/store/.env.local`; copy `apps/store/.env.example` to create it. All settings are described in the [store README](apps/store/README.md).

## Releasing

Run `vp run change` to describe your change with a [changeset](https://github.com/changesets/changesets). Once merged into `main`, a "Version Packages" pull request is opened; merging it publishes the packages to npm. The toolbox is deployed to GitHub Pages on every push to `main`.

## License

[MIT](LICENSE)
