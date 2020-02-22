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
const { createEnforcer, createAdapter, createDisconnectedAdapter, basicModel, basicPolicy, rbacModel, rbacPolicy } = require('../helpers/helpers');
const { newEnforcer } = require('casbin');
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

  it('Should properly store new policy rules from a file', async () => {
    const a = await createAdapter();
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    let e = await newEnforcer(rbacModel, rbacPolicy);

    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    await a.savePolicy(await e.getModel());
    const rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'alice', 'data1', 'read'],
      ['p', 'bob', 'data2', 'write'],
      ['p', 'data2_admin', 'data2', 'read'],
      ['p', 'data2_admin', 'data2', 'write'],
      ['g', 'alice', 'data2_admin', undefined]]);

    // Clear the current policy.
    await e.clearPolicy();
    assert.deepEqual(await e.getPolicy(), []);

    // Load the policy from DB.
    await a.loadPolicy(e.getModel());
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write']]);

    // Note: you don't need to look at the above code
    // if you already have a working DB with policy inside.

    // Now the DB has policy, so we can provide a normal use case.
    // Create an adapter and an enforcer.
    // newEnforcer() will load the policy automatically.
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write']]);

    // Add policy to DB
    await a.addPolicy('', 'p', ['role', 'res', 'action']);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write'],
      ['role', 'res', 'action']]);
    // Remove policy from DB
    await a.removePolicy('', 'p', ['role', 'res', 'action']);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write']]);
  });

  it('Empty Role Definition should not raise an error', async () => {
    const a = await createAdapter();
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    let e = await newEnforcer(basicModel, basicPolicy);

    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    await a.savePolicy(e.getModel());
    const rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'alice', 'data1', 'read'],
      ['p', 'bob', 'data2', 'write']
    ]);

    // Clear the current policy.
    e.clearPolicy();
    assert.deepEqual(await e.getPolicy(), []);

    // Load the policy from DB.
    await a.loadPolicy(e.getModel());
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write']
    ]);

    // Note: you don't need to look at the above code
    // if you already have a working DB with policy inside.

    // Now the DB has policy, so we can provide a normal use case.
    // Create an adapter and an enforcer.
    // newEnforcer() will load the policy automatically.
    e = await newEnforcer(basicModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write']
    ]);

    // Add policy to DB
    await a.addPolicy('', 'p', ['role', 'res', 'action']);
    e = await newEnforcer(basicModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['role', 'res', 'action']]);
    // Remove policy from DB
    await a.removePolicy('', 'p', ['role', 'res', 'action']);
    e = await newEnforcer(basicModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write']
    ]);
  });

  it('Should not store new policy rules if one of them fails', async () => {
    const a = await createAdapter();
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    const e = await newEnforcer(rbacModel, rbacPolicy);
    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    e.getModel().model.set('g', {});

    try {
      await a.savePolicy(e.getModel());
    } catch (err) {
      if (err instanceof TypeError) {
        const rulesAfter = await CasbinRule.find({});
        assert.equal(rulesAfter.length, 0);
      } else {
        throw err;
      }
    }
  });

  it('Should properly fail when transaction is set to true', async () => {
    const a = await createAdapter(true);
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    const e = await newEnforcer(rbacModel, rbacPolicy);

    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    assert.isFalse(await a.savePolicy(e.getModel()));
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

  it('Should remove related policy rules via a filter', async () => {
    const a = await createAdapter();
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    let e = await newEnforcer(rbacModel, rbacPolicy);

    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    await a.savePolicy(e.getModel());
    let rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'alice', 'data1', 'read'],
      ['p', 'bob', 'data2', 'write'],
      ['p', 'data2_admin', 'data2', 'read'],
      ['p', 'data2_admin', 'data2', 'write'],
      ['g', 'alice', 'data2_admin', undefined]]);

    // Remove 'data2_admin' related policy rules via a filter.
    // Two rules: {'data2_admin', 'data2', 'read'}, {'data2_admin', 'data2', 'write'} are deleted.
    await a.removeFilteredPolicy(undefined, undefined, 0, 'data2_admin');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'alice', 'data1', 'read'],
      ['p', 'bob', 'data2', 'write'],
      ['g', 'alice', 'data2_admin', undefined]]);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [['alice', 'data1', 'read'], ['bob', 'data2', 'write']]);

    // Remove 'data1' related policy rules via a filter.
    // One rule: {'alice', 'data1', 'read'} is deleted.
    await a.removeFilteredPolicy(undefined, undefined, 1, 'data1');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'bob', 'data2', 'write'],
      ['g', 'alice', 'data2_admin', undefined]]);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [['bob', 'data2', 'write']]);

    // Remove 'write' related policy rules via a filter.
    // One rule: {'bob', 'data2', 'write'} is deleted.
    await a.removeFilteredPolicy(undefined, undefined, 2, 'write');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['g', 'alice', 'data2_admin', undefined]]);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), []);
  });

  it('Should remove user\'s policies and groups when using deleteUser', async () => {
    const a = await createAdapter();
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    let e = await newEnforcer(rbacModel, rbacPolicy);

    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    await a.savePolicy(e.getModel());
    let rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'alice', 'data1', 'read'],
      ['p', 'bob', 'data2', 'write'],
      ['p', 'data2_admin', 'data2', 'read'],
      ['p', 'data2_admin', 'data2', 'write'],
      ['g', 'alice', 'data2_admin', undefined]]);

    e = await newEnforcer(rbacModel, a);
    // Remove 'alice' related policy rules via a RBAC deleteUser-function.
    // One policy: {'alice', 'data2', 'read'} and One Grouping Policy {'alice', 'data2_admin'} are deleted.
    await e.deleteUser('alice');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'bob', 'data2', 'write'],
      ['p', 'data2_admin', 'data2', 'read'],
      ['p', 'data2_admin', 'data2', 'write']]);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write']]);

    // Remove 'data1' related policy rules via a filter.
    // One rule: {'bob', 'data2', 'write'} is deleted.
    await e.deleteUser('bob');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'data2_admin', 'data2', 'read'],
      ['p', 'data2_admin', 'data2', 'write']]);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write']]);
  });

  it('Should remove user\'s policies and groups when using deleteRole', async () => {
    const a = await createAdapter();
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    let e = await newEnforcer(rbacModel, rbacPolicy);

    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    await a.savePolicy(e.getModel());
    let rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'alice', 'data1', 'read'],
      ['p', 'bob', 'data2', 'write'],
      ['p', 'data2_admin', 'data2', 'read'],
      ['p', 'data2_admin', 'data2', 'write'],
      ['g', 'alice', 'data2_admin', undefined]]);

    e = await newEnforcer(rbacModel, a);
    // Remove 'data2_admin' related policy rules via a RBAC deleteRole-function.
    // One policy: {'alice', 'data2', 'read'} and One Grouping Policy {'alice', 'data2_admin'} are deleted.
    await e.deleteRole('data2_admin');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2]), [
      ['p', 'alice', 'data1', 'read'],
      ['p', 'bob', 'data2', 'write']]);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write']]);
  });

  it('Should allow you to close the connection', async () => {
    // Create mongoAdapter
    const enforcer = await createEnforcer();
    const adapter = enforcer.getAdapter();
    assert.equal(adapter.mongoseInstance.connection.readyState, 1, 'Connection should be open');

    // Connection should close
    await adapter.close();
    assert.equal(adapter.mongoseInstance.connection.readyState, 0, 'Connection should be closed');
  });

  it('Closing a closed/undefined connection should not raise an error', async () => {
    // Create mongoAdapter
    const adapter = await createDisconnectedAdapter();
    // Closing a closed connection should not raise an error
    await adapter.close();
    assert.equal(adapter.mongoseInstance, undefined, 'mongoseInstance should be undefined');
  });
});
