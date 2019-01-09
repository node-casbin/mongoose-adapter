const { assert } = require('chai');
const MongooseAdapter = require('../..');

describe('MongooseAdapter', () => {
  it('Should properly throw error if Mongo URI is not provided', async () => {
    assert.throws(() => new MongooseAdapter(), 'You must provide Mongo URI to connect to!');
  });

  it('Should properly instantiate adapter', async () => {
    const adapter = new MongooseAdapter('mongodb://localhost:27017/casbin');

    assert.instanceOf(adapter, MongooseAdapter);
    assert.isFalse(adapter.isFiltered);
  });

  it('Should properly create new instance via static newAdapter', async () => {
    const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin');

    assert.instanceOf(adapter, MongooseAdapter);
    assert.isFalse(adapter.isFiltered);
  });

  it('Should properly create filtered instance via static newFilteredAdapter', async () => {
    const adapter = await MongooseAdapter.newFilteredAdapter('mongodb://localhost:27017/casbin');

    assert.instanceOf(adapter, MongooseAdapter);
    assert.isTrue(adapter.isFiltered);
  });

  it('Should have implemented interface for casbin', async () => {
    const adapter = new MongooseAdapter('mongodb://localhost:27017/casbin');

    assert.isFunction(MongooseAdapter.newAdapter);
    assert.isFunction(MongooseAdapter.newFilteredAdapter);
    assert.isFunction(adapter.loadPolicyLine);
    assert.isFunction(adapter.loadPolicy);
    assert.isFunction(adapter.loadFilteredPolicy);
    assert.isBoolean(adapter.isFiltered);
    assert.isFunction(adapter.savePolicyLine);
    assert.isFunction(adapter.savePolicy);
    assert.isFunction(adapter.addPolicy);
    assert.isFunction(adapter.removePolicy);
    assert.isFunction(adapter.removeFilteredPolicy);
  });
});
