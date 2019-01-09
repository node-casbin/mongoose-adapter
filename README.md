# casbin-mongoose-adapter

MongoDB policy storage, implemented as an adapter for [node-casbin](https://github.com/casbin/node-casbin).

## Getting Started

Install the package as dependency in your project:

```bash
npm install --save @elastic.io/casbin-mongoose-adapter
```

Require it in a place, where you are instantiating an enforcer ([read more about enforcer here](https://github.com/casbin/node-casbin#get-started)):

```javascript
const path = require('path');
const { newEnforcer } = require('casbin');
const MongooseAdapter = require('@elastic.io/casbin-mongoose-adapter');

const model = path.resolve(__dirname, './your_model.conf');
const adapter = await MongooseAdapter.newAdapter('mongodb://your_mongodb_uri:27017');
const enforcer = await newEnforcer(model, adapter);
```

That is all what required for integrating the adapter into casbin.
Casbin itself calls adapter methods to persist updates you made through it.

## Configuration

You can pass mongooose-specific options when instantiating the adapter:

```javascript
const MongooseAdapter = require('@elastic.io/casbin-mongoose-adapter');
const adapter = await MongooseAdapter.newAdapter('mongodb://your_mongodb_uri:27017', { mongoose_options: 'here' });
```

Additional information regard to options you can pass in you can find in [mongoose documentation](https://mongoosejs.com/docs/connections.html#options)

## Filtered Adapter

You can create an adapter instance that will load only those rules you need to.

A simple case for it is when you have separate policy rules for separate domains (tenants).
You do not need to load all the rules for all domains to make an authorization in specific domain.

For such cases, filtered adapter exists in casbin.

```javascript
const MongooseAdapter = require('@elastic.io/casbin-mongoose-adapter');
const adapter = await MongooseAdapter.newFilteredAdapter('mongodb://your_mongodb_uri:27017');
```

## License

[Apache-2.0](./LICENSE)
