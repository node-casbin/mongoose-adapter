# casbin-mongoose-adapter

MongoDB policy storage, implemented as an adapter for [node-casbin](https://github.com/casbin/node-casbin).

## Getting Started

Install the package as dependency in your project:

```bash
npm install --save @elastic.io/casbin-mongoose-adapter
```

Require it in a place, where you are instantiating an enforcer:

```javascript
const MongooseAdapter = require('@elastic.io/casbin-mongoose-adapter');

async function initEnforcer() {
  const model = path.resolve(__dirname, './model.conf');
  const adapter = await MongooseAdapter.newAdapter('mongodb://your_mongodb_uri:27017');
  const enforcer = await Enforcer.newEnforcer(model, adapter);
}
```

## Configuration

You can pass mongooose-specific options when instantiating the adapter:

```javascript
const MongooseAdapter = require('@elastic.io/casbin-mongoose-adapter');
const adapter = await MongooseAdapter.newAdapter('mongodb://your_mongodb_uri:27017', { mongoose_options: 'here' });
```

Additional information regard to options you can pass in you can find in [mongoose documentation](https://mongoosejs.com/docs/connections.html#options)

## License

[Apache-2.0](./LICENSE)
