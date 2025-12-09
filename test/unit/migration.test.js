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
const { MigrationManager } = require('../../lib/cjs/migration');
const { MongooseAdapter } = require('../../lib/cjs');

describe('MigrationManager (Unit Tests)', () => {
  let adapter;
  let migrationManager;

  beforeEach(async () => {
    adapter = new MongooseAdapter('mongodb://localhost:27001/casbin_test', {}, { skipMigrations: true });
    migrationManager = new MigrationManager(adapter.connection, false);
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  it('Should create a migration manager instance', () => {
    assert.instanceOf(migrationManager, MigrationManager);
  });

  it('Should register a migration', () => {
    const migration = {
      id: 'test_migration',
      description: 'Test migration',
      up: async () => {},
      down: async () => {}
    };

    assert.doesNotThrow(() => {
      migrationManager.registerMigration(migration);
    });
  });

  it('Should throw error when registering duplicate migration ID', () => {
    const migration = {
      id: 'test_migration',
      description: 'Test migration',
      up: async () => {},
      down: async () => {}
    };

    migrationManager.registerMigration(migration);

    assert.throws(() => {
      migrationManager.registerMigration(migration);
    }, "Migration with ID 'test_migration' is already registered");
  });

  it('Should register multiple migrations', () => {
    const migrations = [
      {
        id: 'migration_1',
        description: 'First migration',
        up: async () => {},
        down: async () => {}
      },
      {
        id: 'migration_2',
        description: 'Second migration',
        up: async () => {},
        down: async () => {}
      }
    ];

    assert.doesNotThrow(() => {
      migrationManager.registerMigrations(migrations);
    });
  });

  it('Should have getStatus method', () => {
    assert.isFunction(migrationManager.getStatus);
  });

  it('Should have getPendingMigrations method', () => {
    assert.isFunction(migrationManager.getPendingMigrations);
  });

  it('Should have up method', () => {
    assert.isFunction(migrationManager.up);
  });

  it('Should have down method', () => {
    assert.isFunction(migrationManager.down);
  });

  it('Should have downMultiple method', () => {
    assert.isFunction(migrationManager.downMultiple);
  });

  it('Should have ensureMigrations method', () => {
    assert.isFunction(migrationManager.ensureMigrations);
  });
});
