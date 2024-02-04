# Changelog

## [0.2.1](https://github.com/o-p-n/deployer/compare/v0.2.0...v0.2.1) (2024-02-04)


### Housekeeping

* include full name in package ([#34](https://github.com/o-p-n/deployer/issues/34)) ([4df992c](https://github.com/o-p-n/deployer/commit/4df992cdb04b6c0c4af223ed65ef360962cee703))
* rename to 'o-p-n.deployer' ([#36](https://github.com/o-p-n/deployer/issues/36)) ([e6ee46e](https://github.com/o-p-n/deployer/commit/e6ee46edc3920e78a1e6bfc8e57c51006527399f))

## [0.2.0](https://github.com/o-p-n/deployer/compare/v0.1.1...v0.2.0) (2024-02-03)


### Features

* add kubectl --context flag to 'apply' ([#31](https://github.com/o-p-n/deployer/issues/31)) ([442036f](https://github.com/o-p-n/deployer/commit/442036f3a535f9c4739142f176d1a10c1047e536))


### Fixes

* **tests:** environment variables not always accounted for ([#30](https://github.com/o-p-n/deployer/issues/30)) ([a716c84](https://github.com/o-p-n/deployer/commit/a716c842bb8e8cd162f3082d37c14c5a6e75eb14))


### Housekeeping

* **ci:** validate PR information ([#28](https://github.com/o-p-n/deployer/issues/28)) ([f5a676b](https://github.com/o-p-n/deployer/commit/f5a676b50c8e6077ac5f778db04fc427fe51ce8f))
* **docs:** update documentation to match latest ([#33](https://github.com/o-p-n/deployer/issues/33)) ([1db079d](https://github.com/o-p-n/deployer/commit/1db079d5d955df185082a6e906b4f6721bbc1490))
* **tests:** expand CommandBuilder spy capabilities ([#32](https://github.com/o-p-n/deployer/issues/32)) ([9c16606](https://github.com/o-p-n/deployer/commit/9c16606da739164988a3a2d7b085bb4a7652e15f))

## [0.1.1](https://github.com/o-p-n/deployer/compare/v0.1.0...v0.1.1) (2024-01-27)


### Fixes

* **ci:** missing explicit artifact name ([#26](https://github.com/o-p-n/deployer/issues/26)) ([26ff719](https://github.com/o-p-n/deployer/commit/26ff719b3de417698dfef6f982746aa58acccb7a))

## 0.1.0 (2024-01-27)


### Features

* apply k8s kustomizations ([#14](https://github.com/o-p-n/deployer/issues/14)) ([dc52c53](https://github.com/o-p-n/deployer/commit/dc52c53b41fa06d0bb95fd7e78804a16fdfe277e))
* decrypt files (hidden) ([#9](https://github.com/o-p-n/deployer/issues/9)) ([06d8788](https://github.com/o-p-n/deployer/commit/06d878897d569c3827a8aec25d795cdb0f2d7a9f))
* encrypt files ([#6](https://github.com/o-p-n/deployer/issues/6)) ([a7988ad](https://github.com/o-p-n/deployer/commit/a7988adaf8f9d914803685fb171257bcf3a5cbd2))
* help command ([#10](https://github.com/o-p-n/deployer/issues/10)) ([ed893b2](https://github.com/o-p-n/deployer/commit/ed893b232ad797287ef4bca76fdb13a5559516ed))
* incorporate package info ([#24](https://github.com/o-p-n/deployer/issues/24)) ([d30a573](https://github.com/o-p-n/deployer/commit/d30a573dba2f95e32e3befe0c4b49eaa567074c8))
* initial 'global' cli setup ([#2](https://github.com/o-p-n/deployer/issues/2)) ([a069092](https://github.com/o-p-n/deployer/commit/a0690921c7bacf0234f89959d52687a87230bfa3))
* key operations for sensitive data ([#3](https://github.com/o-p-n/deployer/issues/3)) ([7307a96](https://github.com/o-p-n/deployer/commit/7307a969b8e5a8f9ecb5d809dcaa1069156e0d12))
* remove 'default' timeout check ([#18](https://github.com/o-p-n/deployer/issues/18)) ([fe8e844](https://github.com/o-p-n/deployer/commit/fe8e8443bea9752da80641869263d8e2c54ca67a))
* skip if env does not exist ([#19](https://github.com/o-p-n/deployer/issues/19)) ([b8fd76b](https://github.com/o-p-n/deployer/commit/b8fd76b6d7765f8ee2ce988eaef502581bda78f1))


### Fixes

* **ci:** incorrect artifact path ([#25](https://github.com/o-p-n/deployer/issues/25)) ([05db9e6](https://github.com/o-p-n/deployer/commit/05db9e669bd2ce59c07bd51f6700b72d5bffadd0))


### Refactoring

* better testing with 'dax' ([#12](https://github.com/o-p-n/deployer/issues/12)) ([26e115e](https://github.com/o-p-n/deployer/commit/26e115eb2c6b470f1fe0c1474625e8dfecd5b180))
* remove use of 'any' ([#11](https://github.com/o-p-n/deployer/issues/11)) ([1f708ba](https://github.com/o-p-n/deployer/commit/1f708ba4c71726bdf37689701521bb6a95ae4453))


### Housekeeping

* **build:** fixing up build ([#16](https://github.com/o-p-n/deployer/issues/16)) ([6aa90a7](https://github.com/o-p-n/deployer/commit/6aa90a723b5d9bfd813ef861f25b2c94058c7bba))
* **build:** use lefthook for git hooks ([#4](https://github.com/o-p-n/deployer/issues/4)) ([e00170c](https://github.com/o-p-n/deployer/commit/e00170c816f90709154eae56c207c26511d397ae))
* **build:** use taskfile ([#13](https://github.com/o-p-n/deployer/issues/13)) ([f55042c](https://github.com/o-p-n/deployer/commit/f55042c2aacc9dde8ed981fb5c64faaa0057cbc8))
* **ci:** build on push to main ([#5](https://github.com/o-p-n/deployer/issues/5)) ([56e0688](https://github.com/o-p-n/deployer/commit/56e06887ed9d2fe5814efe45329462e43e3bafda))
* **ci:** Configure CodeCov ([#7](https://github.com/o-p-n/deployer/issues/7)) ([2589afc](https://github.com/o-p-n/deployer/commit/2589afccf612fe046066816d38ee843316f7242c))
* **doc:** readme formatting ([#20](https://github.com/o-p-n/deployer/issues/20)) ([78e5ba2](https://github.com/o-p-n/deployer/commit/78e5ba26dd793d40f0ffeb96a7074f5d7089586f))
* document project ([#17](https://github.com/o-p-n/deployer/issues/17)) ([24d6930](https://github.com/o-p-n/deployer/commit/24d6930d792fe646d9b0e1b0c3d8fa65c0aeeb43))
* get to full coverage ([#15](https://github.com/o-p-n/deployer/issues/15)) ([51f4b33](https://github.com/o-p-n/deployer/commit/51f4b33300a6f128897f734a59892469416d140d))
* increase coverage of executables ([#8](https://github.com/o-p-n/deployer/issues/8)) ([a6457f6](https://github.com/o-p-n/deployer/commit/a6457f6957f8e83112e39d9c2a564f2c8bc8ea13))
* setup Deno project ([#1](https://github.com/o-p-n/deployer/issues/1)) ([7f6e98b](https://github.com/o-p-n/deployer/commit/7f6e98bd7690ddbe480859b06c180b921981b1e0))
* setup project basics ([cf217b5](https://github.com/o-p-n/deployer/commit/cf217b542faf1dfa090f0e5fc5640307fd6ff272))
* setup releases ([#21](https://github.com/o-p-n/deployer/issues/21)) ([e131e11](https://github.com/o-p-n/deployer/commit/e131e11f9a20d1aaf55a7741ba9a43c5c9a98785))
* upgrade dax to 0.37.1 ([#23](https://github.com/o-p-n/deployer/issues/23)) ([c5ebdea](https://github.com/o-p-n/deployer/commit/c5ebdea57c099d011ab376a5f6d7738a3444d10d))
