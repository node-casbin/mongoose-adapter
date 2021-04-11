Mongoose Adapter
====
[![NPM version][npm-image]][npm-url]
[![NPM download][download-image]][download-url]
[![codebeat badge](https://codebeat.co/badges/c17c9ee1-da42-4db3-8047-9574ad2b23b1)](https://codebeat.co/projects/github-com-node-casbin-mongoose-adapter-master)
[![Coverage Status](https://coveralls.io/repos/github/node-casbin/mongoose-adapter/badge.svg?branch=master)](https://coveralls.io/github/node-casbin/mongoose-adapter?branch=master)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/casbin/lobby)
[![tests](https://github.com/node-casbin/mongoose-adapter/actions/workflows/main.yml/badge.svg)](https://github.com/node-casbin/mongoose-adapter/actions/workflows/main.yml)

[npm-image]: https://img.shields.io/npm/v/casbin-mongoose-adapter.svg?style=flat-square
[npm-url]: https://npmjs.org/package/casbin-mongoose-adapter
[download-image]: https://img.shields.io/npm/dm/casbin-mongoose-adapter.svg?style=flat-square
[download-url]: https://npmjs.org/package/casbin-mongoose-adapter

Mongoose Adapter is the [Mongoose](https://github.com/Automattic/mongoose/) adapter for [Node-Casbin](https://github.com/casbin/node-casbin). With this library, Node-Casbin can load policy from Mongoose supported database or save policy to it. It is originally developed by @ghaiklor from @elasticio.

Based on [Officially Supported Databases](https://mongoosejs.com/docs/), The current supported database is MongoDB.

## Getting Started

Install the package as dependency in your project:

```bash
npm install --save casbin-mongoose-adapter casbin
```
**Note**: `casbin` as peerDependencies!

Require it in a place, where you are instantiating an enforcer ([read more about enforcer here](https://github.com/casbin/node-casbin#get-started)):

```javascript
const path = require('path');
const { newEnforcer } = require('casbin');
const MongooseAdapter = require('casbin-mongoose-adapter');

const model = path.resolve(__dirname, './your_model.conf');
const adapter = await MongooseAdapter.newAdapter('mongodb://your_mongodb_uri:27017');
const enforcer = await newEnforcer(model, adapter);
```

That is all what required for integrating the adapter into casbin.
Casbin itself calls adapter methods to persist updates you made through it.

## Configuration

You can pass mongooose-specific options when instantiating the adapter:

```javascript
const MongooseAdapter = require('casbin-mongoose-adapter');
const adapter = await MongooseAdapter.newAdapter('mongodb://your_mongodb_uri:27017', { mongoose_options: 'here' });
```

Additional information regard to options you can pass in you can find in [mongoose documentation](https://mongoosejs.com/docs/connections.html#options)

## Filtered Adapter

You can create an adapter instance that will load only those rules you need to.

A simple case for it is when you have separate policy rules for separate domains (tenants).
You do not need to load all the rules for all domains to make an authorization in specific domain.

For such cases, filtered adapter exists in casbin.

```javascript
const MongooseAdapter = require('casbin-mongoose-adapter');
const adapter = await MongooseAdapter.newFilteredAdapter('mongodb://your_mongodb_uri:27017');
```

## License

[Apache-2.0](./LICENSE)
