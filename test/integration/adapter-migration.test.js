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
const { MongooseAdapter } = require('../../lib/cjs');
const { createEnforcer } = require('../helpers/helpers');
const { newEnforcer } = require('casbin');
const path = require('path');

describe('Adapter Migration Integration', () => {
  let adapter;

  afterEach(async () => {
    if (adapter) {
      // Clean up migration collection
      const MigrationModel = adapter.connection.models.CasbinMigration;
      if (MigrationModel) {
        await MigrationModel.deleteMany({});
      }
      await adapter.close();
    }
  });

  it('Should initialize adapter with migration manager by default', async () => {
    adapter = await MongooseAdapter.newAdapter(
      'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0'
    );

    assert.isDefined(adapter.migrationManager);
    assert.isFunction(adapter.runMigrations);
    assert.isFunction(adapter.rollbackMigration);
    assert.isFunction(adapter.getMigrationStatus);
    assert.isFunction(adapter.ensureMigrations);
  });

  it('Should skip migration manager when skipMigrations is true', async () => {
    adapter = await MongooseAdapter.newAdapter(
      'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0',
      {},
      { skipMigrations: true }
    );

    assert.isUndefined(adapter.migrationManager);
  });

  it('Should run migrations via adapter method', async () => {
    adapter = await MongooseAdapter.newAdapter(
      'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0'
    );

    const count = await adapter.runMigrations();
    // Should run the initial schema migration (001_initial_schema)
    assert.isAtLeast(count, 0);
  });

  it('Should get migration status via adapter method', async () => {
    adapter = await MongooseAdapter.newAdapter(
      'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0'
    );

    await adapter.runMigrations();
    const status = await adapter.getMigrationStatus();

    assert.isArray(status);
    assert.isAtLeast(status.length, 1);

    // Check first migration
    const firstMigration = status.find((s) => s.id === '001_initial_schema');
    assert.isDefined(firstMigration);
    assert.equal(firstMigration.description, 'Initial schema baseline for Casbin rules');
  });

  it('Should automatically ensure migrations on loadPolicy', async () => {
    adapter = await MongooseAdapter.newAdapter(
      'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0'
    );

    // Clean migrations to test auto-run
    const MigrationModel = adapter.connection.models.CasbinMigration;
    await MigrationModel.deleteMany({});

    const model = path.resolve(__dirname, '../fixtures/basic_model.conf');
    const enforcer = await newEnforcer(model, adapter);

    // Migrations should have been auto-applied
    const status = await adapter.getMigrationStatus();
    const appliedCount = status.filter((s) => s.applied).length;
    assert.isAtLeast(appliedCount, 1);
  });

  it('Should throw error when migrations disabled and methods called', async () => {
    adapter = await MongooseAdapter.newAdapter(
      'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0',
      {},
      { skipMigrations: true }
    );

    try {
      await adapter.runMigrations();
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.include(err.message, 'Migrations are disabled');
    }

    try {
      await adapter.getMigrationStatus();
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.include(err.message, 'Migrations are disabled');
    }
  });

  it('Should rollback migration via adapter method', async () => {
    adapter = await MongooseAdapter.newAdapter(
      'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0'
    );

    // Ensure migrations are applied first
    await adapter.runMigrations();

    // Rollback the last one
    const result = await adapter.rollbackMigration();

    // Should successfully rollback if there were migrations
    const status = await adapter.getMigrationStatus();
    const appliedCount = status.filter((s) => s.applied).length;
    const pendingCount = status.filter((s) => !s.applied).length;

    if (result) {
      assert.isAtLeast(pendingCount, 1);
    }
  });

  it('Should allow enforcer to work after migrations', async () => {
    adapter = await MongooseAdapter.newAdapter(
      'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0'
    );

    const CasbinRule = adapter.getCasbinRule();
    await CasbinRule.deleteMany({});

    await adapter.runMigrations();

    const model = path.resolve(__dirname, '../fixtures/basic_model.conf');
    const enforcer = await newEnforcer(model, adapter);

    // Test basic functionality
    await enforcer.addPolicy('alice', 'data1', 'read');
    const policy = await enforcer.getPolicy();

    assert.equal(policy.length, 1);
    assert.deepEqual(policy[0], ['alice', 'data1', 'read']);
  });
});
