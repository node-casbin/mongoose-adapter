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
