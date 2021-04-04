// Copyright 2019 The elastic.io team (http://elastic.io). All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const { assert } = require('chai');
const { MongooseAdapter } = require('../../lib/cjs/index');

console.log(MongooseAdapter);

const MONGOOSE_OPTIONS = { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true };

describe('MongooseAdapter', () => {
  it('Should properly throw error if Mongo URI is not provided', async () => {
    assert.throws(() => new MongooseAdapter(), 'You must provide Mongo URI to connect to!');
  });

  it('Should properly instantiate adapter', async () => {
    const adapter = new MongooseAdapter('mongodb://localhost:27017/casbin', MONGOOSE_OPTIONS);

    assert.instanceOf(adapter, MongooseAdapter);
    assert.isFalse(adapter.isFiltered());
  });

  it('Should properly create new instance via static newAdapter', async () => {
    const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin', MONGOOSE_OPTIONS);

    assert.instanceOf(adapter, MongooseAdapter);
    assert.isFalse(adapter.isFiltered());
  });

  it('Should properly create filtered instance via static newFilteredAdapter', async () => {
    const adapter = await MongooseAdapter.newFilteredAdapter('mongodb://localhost:27017/casbin', MONGOOSE_OPTIONS);

    assert.instanceOf(adapter, MongooseAdapter);
    assert.isTrue(adapter.isFiltered());
  });

  it('Should have implemented interface for casbin', async () => {
    const adapter = new MongooseAdapter('mongodb://localhost:27017/casbin', MONGOOSE_OPTIONS);

    assert.isFunction(MongooseAdapter.newAdapter);
    assert.isFunction(MongooseAdapter.newFilteredAdapter);
    assert.isFunction(MongooseAdapter.newSyncedAdapter);
    assert.isFunction(adapter._open);
    assert.isFunction(adapter.close);
    assert.isFunction(adapter.getSession);
    assert.isFunction(adapter.getTransaction);
    assert.isFunction(adapter.commitTransaction);
    assert.isFunction(adapter.abortTransaction);
    assert.isFunction(adapter.abortTransaction);
    assert.isFunction(adapter.loadPolicyLine);
    assert.isFunction(adapter.loadPolicy);
    assert.isFunction(adapter.loadFilteredPolicy);
    assert.isFunction(adapter.setFiltered);
    assert.isFunction(adapter.setSynced);
    assert.isFunction(adapter.isFiltered);
    assert.isBoolean(adapter.filtered);
    assert.isBoolean(adapter.isSynced);
    assert.isFunction(adapter.savePolicyLine);
    assert.isFunction(adapter.savePolicy);
    assert.isFunction(adapter.addPolicy);
    assert.isFunction(adapter.removePolicy);
    assert.isFunction(adapter.removeFilteredPolicy);
  });
});
