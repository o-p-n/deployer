# O-P-N INFRASTRUCTURE DEPLOYER

[![GHA CI](https://github.com/o-p-n/deployer/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/o-p-n/deployer/actions/workflows/ci.yaml?query=branch%3Amain) [![codecov](https://codecov.io/gh/o-p-n/deployer/graph/badge.svg?token=PAI2ZvxpI0)](https://codecov.io/gh/o-p-n/deployer)

----

A command-line utility for deploying kubernetes resources for [outer-planes.net](https://outer-planes.net/).  It applies a named environment's resources, decrypting senstive to be included and optionally waiting for that environment's custom readiness checks to complete.

- [USAGE](#usage)
  - [`apply` — Apply kustomizations](#apply--apply-kustomizations)
- [SETTING UP](#setting-up)
  - [Dependencies](#dependencies)
  - [Resource Structure](#resource-structure)
  - [`kubectl` Assumptions](#kubectl-assumptions)
  - [Secrets Management](#secrets-management)

## USAGE

`deployer` has various sub-commands to perform resource management.  Using `deployer` requires [preparation](#setting-up) to operate successfully.

```
  help     [command]  - Show this help or the help of a sub-command.
  apply               - apply resources for the given environment
  encrypt  <file>     - encrypts a data file for the given environment
  decrypt  <file>     - decrypts a data file for the given environment
```

### `apply` — Apply kustomizations

```
  -h, --help                        - Show this help.
  -e, --env           <env>         - the environment to operate on                          (required)
  -I, --identity-dir  <identities>  - directory containing identities (public/private keys)
  --bootstrap, -b     [bootstrap]   - also apply bootstrap
```
Applies the resources for the environment specified by `--env <env>`.  Any secrets for that environment are first decrypted.  If the environment has a `apply-ready.sh` script, it will be run after applying to wait and verify the resources are completely applied.

If `--bootstrap` is specified and a `bootstrap` directory is found, those resources are deployed first.  If the bootstrap has a `apply-ready.sh` script, it will be run after applying the boostrapping to wait and verify the resources are completely applied.  **NOTE** that `bootstrap`-level secrets are not supported.

## SETTING UP

### Dependencies

Using `deployer` requires the following to be installed and available in your `$PATH`:
* [`kubectl`](https://kubectl.docs.kubernetes.io/) (>= 1.19)
* [`sops`](https://github.com/getsops/sops) (>= 3.8)

Optionally, the following could be useful (but are not required nor used by `deployer`):
* [`age`](https://age-encryption.org/) (>= 1.1) (specifically `age-keygen` for generating encryption keys)

### Resource Structure

For components, `deployer` expects [Kustomize](https://kustomize.io/) directories within following directory structures:

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

For a named environment, its directory contains a `kustomization.yaml` that loads the component's resources.  It also contains 

### `kubectl` Assumptions

Using `deployer` requires the `kubectl` configuration file has a context defined for each named environment.  It also expects any connectivity requirements (e.g., SSH forwarding) are established and ready before executing `deployer`.

### Secrets Management

Any secrets needed by the component can be inline with the other resources, encrypted using `sops`.  `deployer` will decrypt those secrets before applying the kustomization.  The secrets are assumed to be encrypted using [`age`](https://age-encryption.org/) keys, stored in a pair of files per environment:

* `{env}.key` — Age private key to decrypt `{env}`'s secrets
* `{env}.key.pub` — Age public key to encrypt `{env}`'s secrets

Those keypair files will be assumed to be in the current working directory, although that path can be customized using the environment variable `${DEPLOYER_IDENTITY_DIR}` or on the command-line with the `--identity-dir <path>` option.
