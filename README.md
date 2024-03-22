# O-P-N INFRASTRUCTURE DEPLOYER

[![GHA CI](https://github.com/o-p-n/deployer/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/o-p-n/deployer/actions/workflows/ci.yaml?query=branch%3Amain) [![codecov](https://codecov.io/gh/o-p-n/deployer/graph/badge.svg?token=PAI2ZvxpI0)](https://codecov.io/gh/o-p-n/deployer)

---

A command-line utility for deploying kubernetes resources for [outer-planes.net](https://outer-planes.net/). It applies a named environment's resources, decrypting senstive to be included and optionally waiting for that environment's custom readiness checks to complete.

- [INSTALLING](#installing)
- [USAGE](#usage)
  - [`apply` — Apply kustomizations](#apply--apply-kustomizations)
  - [`encrypt` — Protect secrets](#encrypt--protect-secrets)
- [UNSAFE USAGE](#unsafe-usage)
  - [`decrypt` — Unwrap secrets](#decrypt--unwrap-secrets)
  - [`render` — Render kustomization](#render--render-kustomization)
- [SETTING UP](#setting-up)
  - [Dependencies](#dependencies)
  - [Resource Structure](#resource-structure)
  - [`kubectl` Assumptions](#kubectl-assumptions)
  - [Secrets Management](#secrets-management)

## INSTALLING

Install `o-p-n.deployer` for your platform from the GitHub releases and extract, then move to somewhere in your `PATH`:

```
curl -sL https://https://github.com/o-p-n/deployer/releases/download/v{VERSION}/o-p-n.deployer-{VERSION}-{PLATFORM}.tar.gz | tar xzf -
mv o-p-n.deployer /usr/local/bin
```

## USAGE

`o-p-n.deployer` has various sub-commands to perform resource management. Using `o-p-n.deployer` requires [preparation](#setting-up) to operate successfully.

```
help     [command]  - Show this help or the help of a sub-command.
apply               - apply resources for the given environment
encrypt  <file>     - encrypts a data file for the given environment
decrypt  <file>     - decrypts a data file for the given environment
```

### `apply` — Apply kustomizations

```
Usage: o-p-n.deployer apply --env <env>

  -h, --help                        - Show this help.
  -e, --env           <env>         - the environment to operate on                          (required)
  -I, --identity-dir  <identities>  - directory containing identities (public/private keys)
  -b, --bootstrap                   - also apply bootstrap
  -C, --context       <context>     - use kubectl context
```

Applies the resources for the environment specified by `--env <env>`. Any secrets for that environment are first decrypted. If the environment has a `apply-ready.sh` script, it will be run after applying to wait and verify the resources are completely applied.

If `--bootstrap` is specified and a `bootstrap` directory is found, those resources are deployed first. If the bootstrap has a `apply-ready.sh` script, it will be run after applying the boostrapping to wait and verify the resources are completely applied. **NOTE** that `bootstrap`-level secrets are not supported.

If `--context` is specified, the named context is used with `kubectl`. By default the current context is used.

### `encrypt` — Protect secrets

```
Usage: o-p-n.deployer encrypt <file> --env <env>

  -h, --help                        - Show this help.
  -e, --env           <env>         - the environment to operate on                          (required)
  -I, --identity-dir  <identities>  - directory containing identities (public/private keys)
```

Encrypts the given data file for the given environment. The data file is assumed to be located in the environment-specific directory; e.g., the file `secrets.env` for the `local` environment exists in `k8s/env/local/secrets.env`.

The file is encrypted with the public key for the given environment (e.g., the public key `local.key.pub` for `local`).

The resulting encrypted file retains the same name as the original file plus the extension `.sops` appended; e.g., encrypting `secrets.env` results in the output file `secrets.env.sops`.

## UNSAFE USAGE

The following commands are considered unsafe; they can potentially leak sensitive information (e.g., API tokens).

### `decrypt` — Unwrap secrets

```
Usage: o-p-n.deployer decrypt <file> --env <env>
  -h, --help                        - Show this help.
  -e, --env           <env>         - the environment to operate on                          (required)
  -I, --identity-dir  <identities>  - directory containing identities (public/private keys)
```

Decrypts the given protected data file for the given environment.  The protected data faile is assumed to be located in the environment-specific directory; e.g., the file `secrets.env.sops` for the `local` environment exists in `k8s/env/local/secrets.env.sops`.

The file is decrypted with the private key for the given environment (e.g, the private key `local.key` for `local`).

The resulting _decrypted_ file retains the same name as the original file minus the extension `.sops`; e.g., decrypting `secrets.env.sops` results in the output file `secrets.env`.

### `render` — Render kustomization


## SETTING UP

### Dependencies

Using `o-p-n.deployer` requires the following to be installed and available in your `$PATH`:

- [`kubectl`](https://kubectl.docs.kubernetes.io/) (>= 1.19)
- [`sops`](https://github.com/getsops/sops) (>= 3.8)

Optionally, the following could be useful (but are not required nor used by `o-p-n.deployer`):

- [`age`](https://age-encryption.org/) (>= 1.1) (specifically `age-keygen` for generating encryption keys)

### Resource Structure

For components, `o-p-n.deployer` expects [Kustomize](https://kustomize.io/) directories within following directory structures:

```
< app/component >
  +-- k8s
      +-- bootstrap (OPTIONAL) 
      |   +-- kustomization.yaml
      |       ... other files ...
      |   +-- apply-ready.sh (OPTIONAL)
      +-- env
          +-- < named environment #1 >
          |   +-- kustomization.yaml
          |       ... other files ...
          |   +-- apply-ready.sh (OPTIONAL)
          +-- ...
```

For a named environment, its directory contains a `kustomization.yaml` that loads the component's resources. It also contains

### `kubectl` Assumptions

Using `o-p-n.deployer` expects any connectivity requirements (e.g., SSH forwarding) are established and ready before executing `o-p-n.deployer`. It also assumes the current context is appropriate for the specified environment, although the `--context` flag can be used to specify a different context.

### Secrets Management

Any secrets needed by the component can be inline with the other resources, encrypted using `sops`. `o-p-n.deployer` will decrypt those secrets before applying the kustomization. The secrets are assumed to be encrypted using [`age`](https://age-encryption.org/) keys, stored in a pair of files per environment:

- `{env}.key` — Age private key to decrypt `{env}`'s secrets
- `{env}.key.pub` — Age public key to encrypt `{env}`'s secrets

Those keypair files will be assumed to be in the current working directory, although that path can be customized using the environment variable `${DEPLOYER_IDENTITY_DIR}` or on the command-line with the `--identity-dir <path>` option.
