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
const sinon = require('sinon');
const {
  createEnforcer,
  createAdapter,
  createDisconnectedAdapter,
  createSyncedAdapter,
  basicModel,
  basicPolicy,
  rbacModel,
  rbacPolicy,
  rbacDenyDomainModel,
  rbacDenyDomainPolicy
} = require('../helpers/helpers');
const { newEnforcer, Model } = require('casbin');
const CasbinRule = require('../../src/model');
const { InvalidAdapterTypeError } = require('../../src/errors');

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

  it('Should properly add and remove policies', async () => {
    const a = await createSyncedAdapter();

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

    // Add a single policy to Database
    await a.addPolicy('', 'p', ['role', 'res', 'action']);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write'],
      ['role', 'res', 'action']]);

    // Add a policyList to Database
    await a.addPolicies('', 'p', [['role', 'res', 'GET'], ['role', 'res', 'POST']]);
    e = await newEnforcer(rbacModel, a);

    // Clear the current policy.
    await e.clearPolicy();
    assert.deepEqual(await e.getPolicy(), []);

    // Load the policy from Database.
    await a.loadPolicy(e.getModel());
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write'],
      ['role', 'res', 'action'],
      ['role', 'res', 'GET'],
      ['role', 'res', 'POST']]);

    // Remove a single policy from Database
    await a.removePolicy('', 'p', ['role', 'res', 'action']);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write'],
      ['role', 'res', 'GET'],
      ['role', 'res', 'POST']]);

    // Remove a policylist from Database
    await a.removePolicies('', 'p', [['role', 'res', 'GET'], ['role', 'res', 'POST']]);
    e = await newEnforcer(rbacModel, a);

    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write']]);
  });

  it('Add Policies and Remove Policies should not work on normal adapter', async () => {
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

    // Add a single policy to Database
    await a.addPolicy('', 'p', ['role', 'res', 'action']);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write'],
      ['role', 'res', 'action']]);

    // Add policyList to Database
    try {
      await a.addPolicies('', 'p', [['role', 'res', 'GET'], ['role', 'res', 'POST']]);
    } catch (error) {
      assert(error instanceof InvalidAdapterTypeError);
      assert.equal(error.message, 'addPolicies is only supported by SyncedAdapter. See newSyncedAdapter');
    }

    e = await newEnforcer(rbacModel, a);

    // Clear the current policy.
    await e.clearPolicy();
    assert.deepEqual(await e.getPolicy(), []);

    // Load the policy from Database.
    await a.loadPolicy(e.getModel());
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write'],
      ['role', 'res', 'action']]);

    // Remove a single policy from Database
    await a.removePolicy('', 'p', ['role', 'res', 'action']);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write']]);

    // Remove a policylist from Database

    try {
      await a.removePolicies('', 'p', [['data2_admin', 'datag1712', 'read'], ['data2_admin', 'data2', 'write']]);
    } catch (error) {
      assert(error instanceof InvalidAdapterTypeError);
      assert.equal(error.message, 'removePolicies is only supported by SyncedAdapter. See newSyncedAdapter');
    }
    e = await newEnforcer(rbacModel, a);

    assert.deepEqual(await e.getPolicy(), [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write']]);
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

  it('Empty Policy return false and log an error', async () => {
    const a = await createAdapter();
    console.error = sinon.stub();
    assert.isNotOk(await a.savePolicy(new Model()));
    assert(console.error.lastCall.firstArg.name, 'MongoError');
    assert(console.error.callCount, 1);
    if (console.error.restore) console.error.restore();
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
    try {
      await createAdapter(true);
    } catch (error) {
      assert.equal(error, 'Error: Tried to enable transactions for non-replicaset connection');
    }
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

  it('Should properly store new complex policy rules from a file', async () => {
    const a = await createAdapter();
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    let e = await newEnforcer(rbacDenyDomainModel, rbacDenyDomainPolicy);

    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    await a.savePolicy(await e.getModel());
    const rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), [
      ['p', 'admin', 'domain1', 'data1', 'read', 'allow'],
      ['p', 'admin', 'domain1', 'data1', 'write', 'allow'],
      ['p', 'admin', 'domain2', 'data2', 'read', 'allow'],
      ['p', 'admin', 'domain2', 'data2', 'write', 'allow'],
      ['p', 'alice', 'domain2', 'data2', 'write', 'deny'],
      ['g', 'alice', 'admin', 'domain2', undefined, undefined]]);

    // Clear the current policy.
    await e.clearPolicy();
    assert.deepEqual(await e.getPolicy(), []);

    // Load the policy from DB.
    await a.loadPolicy(e.getModel());
    assert.deepEqual(await e.getPolicy(), [
      ['admin', 'domain1', 'data1', 'read', 'allow'],
      ['admin', 'domain1', 'data1', 'write', 'allow'],
      ['admin', 'domain2', 'data2', 'read', 'allow'],
      ['admin', 'domain2', 'data2', 'write', 'allow'],
      ['alice', 'domain2', 'data2', 'write', 'deny']]);

    // Note: you don't need to look at the above code
    // if you already have a working DB with policy inside.

    // Now the DB has policy, so we can provide a normal use case.
    // Create an adapter and an enforcer.
    // newEnforcer() will load the policy automatically.
    e = await newEnforcer(rbacDenyDomainModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['admin', 'domain1', 'data1', 'read', 'allow'],
      ['admin', 'domain1', 'data1', 'write', 'allow'],
      ['admin', 'domain2', 'data2', 'read', 'allow'],
      ['admin', 'domain2', 'data2', 'write', 'allow'],
      ['alice', 'domain2', 'data2', 'write', 'deny']]);

    // Add policy to DB
    await a.addPolicy('', 'p', ['role', 'domain', 'res', 'action', 'allow']);
    e = await newEnforcer(rbacDenyDomainModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['admin', 'domain1', 'data1', 'read', 'allow'],
      ['admin', 'domain1', 'data1', 'write', 'allow'],
      ['admin', 'domain2', 'data2', 'read', 'allow'],
      ['admin', 'domain2', 'data2', 'write', 'allow'],
      ['alice', 'domain2', 'data2', 'write', 'deny'],
      ['role', 'domain', 'res', 'action', 'allow']]);
    // Remove policy from DB
    await a.removePolicy('', 'p', ['role', 'domain', 'res', 'action', 'allow']);
    e = await newEnforcer(rbacDenyDomainModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['admin', 'domain1', 'data1', 'read', 'allow'],
      ['admin', 'domain1', 'data1', 'write', 'allow'],
      ['admin', 'domain2', 'data2', 'read', 'allow'],
      ['admin', 'domain2', 'data2', 'write', 'allow'],
      ['alice', 'domain2', 'data2', 'write', 'deny']]);
    // Enforce a rule
    assert.notOk(await e.enforce('alice', 'domain2', 'data2', 'write'));
    assert.ok(await e.enforce('admin', 'domain2', 'data2', 'write'));
    assert.ok(await e.enforce('admin', 'domain2', 'data2', 'write'));
    assert.ok(await e.enforce('admin', 'domain2', 'data2', 'read'));
    assert.ok(await e.enforce('alice', 'domain2', 'data2', 'read'));
    assert.notOk(await e.enforce('alice', 'domain1', 'data1', 'read'));
    assert.notOk(await e.enforce('alice', 'domain1', 'data1', 'write'));
  });

  it('Should remove related complex policy rules via a filter', async () => {
    const a = await createAdapter();
    // Because the DB is empty at first,
    // so we need to load the policy from the file adapter (.CSV) first.
    let e = await newEnforcer(rbacDenyDomainModel, rbacDenyDomainPolicy);

    const rulesBefore = await CasbinRule.find({});
    assert.equal(rulesBefore.length, 0);

    // This is a trick to save the current policy to the DB.
    // We can't call e.savePolicy() because the adapter in the enforcer is still the file adapter.
    // The current policy means the policy in the Node-Casbin enforcer (aka in memory).
    await a.savePolicy(e.getModel());
    let rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), [
      ['p', 'admin', 'domain1', 'data1', 'read', 'allow'],
      ['p', 'admin', 'domain1', 'data1', 'write', 'allow'],
      ['p', 'admin', 'domain2', 'data2', 'read', 'allow'],
      ['p', 'admin', 'domain2', 'data2', 'write', 'allow'],
      ['p', 'alice', 'domain2', 'data2', 'write', 'deny'],
      ['g', 'alice', 'admin', 'domain2', undefined, undefined]]);
    e = await newEnforcer(rbacDenyDomainModel, a);
    assert.deepEqual(await e.getPolicy(), [['admin', 'domain1', 'data1', 'read', 'allow'],
      ['admin', 'domain1', 'data1', 'write', 'allow'],
      ['admin', 'domain2', 'data2', 'read', 'allow'],
      ['admin', 'domain2', 'data2', 'write', 'allow'],
      ['alice', 'domain2', 'data2', 'write', 'deny']]);

    // Remove 'data2_admin' related policy rules via a filter.
    // Four rules:
    // {'admin', 'domain1', 'data1', 'read', 'allow'},
    // {'admin', 'domain1', 'data1', 'write', 'allow'},
    // {'admin', 'domain2', 'data2', 'read', 'allow'},
    // {'admin', 'domain2', 'data2', 'write', 'allow'}
    // are deleted.
    await a.removeFilteredPolicy(undefined, undefined, 0, 'admin');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), [
      ['p', 'alice', 'domain2', 'data2', 'write', 'deny'],
      ['g', 'alice', 'admin', 'domain2', undefined, undefined]]);
    e = await newEnforcer(rbacDenyDomainModel, a);
    assert.deepEqual(await e.getPolicy(), [['alice', 'domain2', 'data2', 'write', 'deny']]);
    await a.removeFilteredPolicy(undefined, 'g');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), [
      ['p', 'alice', 'domain2', 'data2', 'write', 'deny']]);
    await a.removeFilteredPolicy(undefined, 'p');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), []);

    // Reload the mode + policy
    e = await newEnforcer(rbacDenyDomainModel, rbacDenyDomainPolicy);
    await a.savePolicy(e.getModel());
    // Remove 'domain2' related policy rules via a filter.
    // Three rules:
    // {'p', 'admin', 'domain2', 'data2', 'read', 'allow'},
    // {'p', 'admin', 'domain2', 'data2', 'write', 'allow'},
    // {'p', 'alice', 'domain2', 'data2', 'write', 'deny'}
    // are deleted.
    await a.removeFilteredPolicy(undefined, undefined, 1, 'domain2');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), [
      ['p', 'admin', 'domain1', 'data1', 'read', 'allow'],
      ['p', 'admin', 'domain1', 'data1', 'write', 'allow'],
      ['g', 'alice', 'admin', 'domain2', undefined, undefined]]);
    e = await newEnforcer(rbacModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['admin', 'domain1', 'data1', 'read', 'allow'],
      ['admin', 'domain1', 'data1', 'write', 'allow']]);

    // Remove 'data1' related policy rules via a filter.
    // Two rules:
    // {'admin', 'domain1', 'data1', 'read', 'allow'},
    // {'admin', 'domain1', 'data1', 'write', 'allow'}
    // are deleted.
    await a.removeFilteredPolicy(undefined, undefined, 2, 'data1');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), [
      ['g', 'alice', 'admin', 'domain2', undefined, undefined]]);
    e = await newEnforcer(rbacDenyDomainModel, a);
    assert.deepEqual(await e.getPolicy(), []);

    await a.removeFilteredPolicy(undefined, 'g');
    await a.removeFilteredPolicy(undefined, 'p');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), []);

    e = await newEnforcer(rbacDenyDomainModel, rbacDenyDomainPolicy);
    await a.savePolicy(e.getModel());

    // Remove 'read' related policy rules via a filter.
    // Two rules:
    // {'admin', 'domain1', 'data1', 'read', 'allow'},
    // {'admin', 'domain2', 'data2', 'read', 'allow'}
    // are deleted.
    await a.removeFilteredPolicy(undefined, undefined, 3, 'read');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), [
      ['p', 'admin', 'domain1', 'data1', 'write', 'allow'],
      ['p', 'admin', 'domain2', 'data2', 'write', 'allow'],
      ['p', 'alice', 'domain2', 'data2', 'write', 'deny'],
      ['g', 'alice', 'admin', 'domain2', undefined, undefined]]);
    e = await newEnforcer(rbacDenyDomainModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['admin', 'domain1', 'data1', 'write', 'allow'],
      ['admin', 'domain2', 'data2', 'write', 'allow'],
      ['alice', 'domain2', 'data2', 'write', 'deny']]);

    // Remove 'read' related policy rules via a filter.
    // One rule:
    // {'alice', 'domain2', 'data2', 'write', 'deny'},
    // is deleted.
    await a.removeFilteredPolicy(undefined, undefined, 4, 'deny');
    rulesAfter = await CasbinRule.find({});
    assert.deepEqual(rulesAfter.map(rule => [rule.p_type, rule.v0, rule.v1, rule.v2, rule.v3, rule.v4]), [
      ['p', 'admin', 'domain1', 'data1', 'write', 'allow'],
      ['p', 'admin', 'domain2', 'data2', 'write', 'allow'],
      ['g', 'alice', 'admin', 'domain2', undefined, undefined]]);
    e = await newEnforcer(rbacDenyDomainModel, a);
    assert.deepEqual(await e.getPolicy(), [
      ['admin', 'domain1', 'data1', 'write', 'allow'],
      ['admin', 'domain2', 'data2', 'write', 'allow']]);
  });

  it('SetSynced should fail in non-replicaset connection', async () => {
    // Create SyncedMongoAdapter
    try {
      const adapter = await createAdapter();
      adapter.setSynced(true);
    } catch (error) {
      assert(error instanceof InvalidAdapterTypeError);
      assert.equal(error.message, 'Tried to enable transactions for non-replicaset connection');
    }
  });

  it('getSession should fail in non-replicaset connection', async () => {
    // Create SyncedMongoAdapter
    try {
      const adapter = await createAdapter();
      adapter.getSession();
    } catch (error) {
      assert(error instanceof InvalidAdapterTypeError);
      assert.equal(error.message, 'Tried to start a session for non-replicaset connection');
    }
  });

  it('getTransaction should fail in non-replicaset connection', async () => {
    // Create SyncedMongoAdapter
    try {
      const adapter = await createAdapter();
      adapter.getTransaction();
    } catch (error) {
      assert(error instanceof InvalidAdapterTypeError);
      assert.equal(error.message, 'Tried to start a session for non-replicaset connection');
    }
  });

  it('commitTransaction should fail in non-replicaset connection', async () => {
    // Create SyncedMongoAdapter
    try {
      const adapter = await createAdapter();
      adapter.commitTransaction();
    } catch (error) {
      assert(error instanceof InvalidAdapterTypeError);
      assert.equal(error.message, 'Tried to start a session for non-replicaset connection');
    }
  });

  it('abortTransaction should fail in non-replicaset connection', async () => {
    // Create SyncedMongoAdapter
    try {
      const adapter = await createAdapter();
      adapter.abortTransaction();
    } catch (error) {
      assert(error instanceof InvalidAdapterTypeError);
      assert(error.message, 'Tried to start a session for non-replicaset connection');
    }
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
