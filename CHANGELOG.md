# [5.3.0](https://github.com/node-casbin/mongoose-adapter/compare/v5.2.0...v5.3.0) (2023-07-14)


### Features

* update mongoose dependency to 7.3.4 ([#73](https://github.com/node-casbin/mongoose-adapter/issues/73)) ([bbc7953](https://github.com/node-casbin/mongoose-adapter/commit/bbc79536d6abf5aca92bd83e601a457104f0b02a))

# [5.2.0](https://github.com/node-casbin/mongoose-adapter/compare/v5.1.1...v5.2.0) (2023-04-21)


### Features

* enable mongoose timestamps for casbin rule model via adapter options ([#71](https://github.com/node-casbin/mongoose-adapter/issues/71)) ([3dd8862](https://github.com/node-casbin/mongoose-adapter/commit/3dd8862f8eb452adc1365c96df55125561358bb1))

## [5.1.1](https://github.com/node-casbin/mongoose-adapter/compare/v5.1.0...v5.1.1) (2023-04-19)


### Bug Fixes

* fix multiple adapter ([#68](https://github.com/node-casbin/mongoose-adapter/issues/68)) ([49e69bc](https://github.com/node-casbin/mongoose-adapter/commit/49e69bc2f526fdb42b7410a04173c6b4c58bb635))

# [5.1.0](https://github.com/node-casbin/mongoose-adapter/compare/v5.0.0...v5.1.0) (2022-03-21)


### Bug Fixes

* format issues ([d653519](https://github.com/node-casbin/mongoose-adapter/commit/d653519ec3cfc8b1f81d2a061dbb86df1a4df9c3))
* token parsing issues if token contains delimeter ([cd695a6](https://github.com/node-casbin/mongoose-adapter/commit/cd695a68f7f45faaae065d4e37c7d4593f7d09b9))
* update lock file ([203cc98](https://github.com/node-casbin/mongoose-adapter/commit/203cc98d9db46e10319f89ea6ab3affe98c2098b))


### Features

* add postinstall script ([af93ec8](https://github.com/node-casbin/mongoose-adapter/commit/af93ec8025f10bd761b47c276a841e368f61bc1a))
* check if the word is already wrapped in quotes ([d31166e](https://github.com/node-casbin/mongoose-adapter/commit/d31166e3fd8f67eb6ffcff475a68916f61ce7f60))

# [5.0.0](https://github.com/node-casbin/mongoose-adapter/compare/v4.0.1...v5.0.0) (2022-03-13)


### Bug Fixes

* change p_type to ptype ([#61](https://github.com/node-casbin/mongoose-adapter/issues/61)) ([1167bed](https://github.com/node-casbin/mongoose-adapter/commit/1167bed29efc618f09fef7b7c98d8ff81520369f))


### BREAKING CHANGES

* we will finally move to `ptype`, as discussed one year ago: https://github.com/pycasbin/sqlalchemy-adapter/issues/26#issuecomment-769799410 . It is also officially documented in the official site: https://casbin.org/docs/en/adapters#:~:text=Ptype%20Column.%20Name%20of%20this%20column%20should%20be%20ptype%20instead%20of%20p_type%20or%20Ptype

Co-authored-by: Shivansh Yadav <yadavshivansh@gmail.com>

## [4.0.1](https://github.com/node-casbin/mongoose-adapter/compare/v4.0.0...v4.0.1) (2022-01-31)


### Bug Fixes

* **adapter:** expose mongoose instance as public property ([#54](https://github.com/node-casbin/mongoose-adapter/issues/54)) ([31e6ef9](https://github.com/node-casbin/mongoose-adapter/commit/31e6ef9f81aebba385d0b7a0e66960c23e316c4f))

# [4.0.0](https://github.com/node-casbin/mongoose-adapter/compare/v3.1.1...v4.0.0) (2022-01-29)


### Features

* upgrade Mongoose ([#52](https://github.com/node-casbin/mongoose-adapter/issues/52)) ([fb53794](https://github.com/node-casbin/mongoose-adapter/commit/fb5379432397710a27570b116ea3f7459f4bd3b6))


### BREAKING CHANGES

* upgrade to Mongoose 6.x and drop Node 10 support

## [3.1.1](https://github.com/node-casbin/mongoose-adapter/compare/v3.1.0...v3.1.1) (2021-08-28)


### Bug Fixes

* fix wrong action with empty string ([#47](https://github.com/node-casbin/mongoose-adapter/issues/47)) ([f51fdde](https://github.com/node-casbin/mongoose-adapter/commit/f51fdde975df95a33c0b9bbcc8fdcf64b7af73a2))

# [3.1.0](https://github.com/node-casbin/mongoose-adapter/compare/v3.0.1...v3.1.0) (2021-08-03)


### Features

* implement UpdatableAdapter interface ([#49](https://github.com/node-casbin/mongoose-adapter/issues/49)) ([131a446](https://github.com/node-casbin/mongoose-adapter/commit/131a446b813b202d322ac0d0fc45d436e34832ca))

## [3.0.1](https://github.com/node-casbin/mongoose-adapter/compare/v3.0.0...v3.0.1) (2021-04-27)


### Bug Fixes

* no longer support legacy require ([5b09912](https://github.com/node-casbin/mongoose-adapter/commit/5b09912a693a3cf6442d640fe4031938a373c820))
