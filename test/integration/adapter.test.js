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
const createEnforcer = require('../helpers/createEnforcer');
const CasbinRule = require('../../src/model');

// These tests are just smoke tests for get/set policy rules
// We do not need to cover other aspects of casbin, since casbin itself is covered with tests
describe('MongooseAdapter', () => {
  beforeEach(async () => {
    await createEnforcer();
    await CasbinRule.deleteMany();
  });

  it('Should properly load policy', async () => {
    const enforcer = await createEnforcer();
    assert.deepEqual(await enforcer.getPolicy(), []);

    const rules = await CasbinRule.find();
    assert.deepEqual(rules, []);
  });

  it('Should properly store new policy rules', async () => {
    const enforcer = await createEnforcer();

    const rulesBefore = await CasbinRule.find();
    assert.deepEqual(rulesBefore, []);
    assert.isTrue(await enforcer.addPolicy('sub', 'obj', 'act'));
    assert.deepEqual(await enforcer.getPolicy(), [['sub', 'obj', 'act']]);

    const rulesAfter = await CasbinRule.find({ p_type: 'p', v0: 'sub', v1: 'obj', v2: 'act' });
    assert.equal(rulesAfter.length, 1);
  });

  it('Should properly delete existing policy rules', async () => {
    const enforcer = await createEnforcer();

    const rulesBefore = await CasbinRule.find();
    assert.deepEqual(rulesBefore, []);
    assert.isTrue(await enforcer.addPolicy('sub', 'obj', 'act'));
    assert.deepEqual(await enforcer.getPolicy(), [['sub', 'obj', 'act']]);

    const rulesAfter = await CasbinRule.find({ p_type: 'p', v0: 'sub', v1: 'obj', v2: 'act' });
    assert.equal(rulesAfter.length, 1);
    assert.isTrue(await enforcer.removePolicy('sub', 'obj', 'act'));
    assert.deepEqual(await enforcer.getPolicy(), []);

    const rulesAfterDelete = await CasbinRule.find({ p_type: 'p', v0: 'sub', v1: 'obj', v2: 'act' });
    assert.equal(rulesAfterDelete.length, 0);
  });

  it('Should allow you to close the connection', async () => {
    const enforcer = await createEnforcer();
    const adapter = enforcer.getAdapter();
    assert.equal(adapter.mongoseInstance.connection.readyState, 1);
    await adapter.close();
    assert.equal(adapter.mongoseInstance.connection.readyState, 0);
  });
});
