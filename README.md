# O-P-N INFRASTRUCTURE DEPLOYER

A command-line utility for deploying kubernetes resources for [outer-planes.net](https://outer-planes.net/).  It applies a named environment's resources, decrypting senstive to be included and optionally waiting for that environment's custom readiness checks to complete.

- [SETTING UP](#setting-up)
  - [Dependencies](#dependencies)
  - [Resource Structure](#resource-structure)
  - [`kubectl` Assumptions](#kubectl-assumptions)

## SETTING UP

### Dependencies

Using `deployer` requires the following to be installed and available in your `$PATH`:
* [`kubectl`](https://kubectl.docs.kubernetes.io/) (>= 1.19)
* [`sops`](https://github.com/getsops/sops) (>= 3.8)

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

Using `deployer` requires the `kubectl` configuration file in `${KUBECONFIG}` has a context defined for each named environment.
