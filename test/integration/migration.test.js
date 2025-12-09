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
const { createAdapter } = require('../helpers/helpers');

describe('MigrationManager (Integration Tests)', () => {
  let adapter;
  let migrationManager;

  beforeEach(async () => {
    adapter = await createAdapter(false);
    migrationManager = new MigrationManager(adapter.connection, false);

    // Clean up migration collection
    const MigrationModel = adapter.connection.models.CasbinMigration;
    if (MigrationModel) {
      await MigrationModel.deleteMany({});
    }
  });

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

  it('Should return empty array for pending migrations when none registered', async () => {
    const pending = await migrationManager.getPendingMigrations();
    assert.isArray(pending);
    assert.equal(pending.length, 0);
  });

  it('Should return pending migration when migration is registered but not applied', async () => {
    const migration = {
      id: 'test_001',
      description: 'Test migration',
      up: async () => {},
      down: async () => {}
    };

    migrationManager.registerMigration(migration);
    const pending = await migrationManager.getPendingMigrations();

    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, 'test_001');
  });

  it('Should execute up migration and track it', async () => {
    let executed = false;
    const migration = {
      id: 'test_002',
      description: 'Test migration 2',
      up: async () => {
        executed = true;
      },
      down: async () => {}
    };

    migrationManager.registerMigration(migration);

    const count = await migrationManager.up();
    assert.equal(count, 1);
    assert.isTrue(executed);

    const pending = await migrationManager.getPendingMigrations();
    assert.equal(pending.length, 0);
  });

  it('Should execute multiple migrations in order', async () => {
    const executionOrder = [];
    const migrations = [
      {
        id: 'test_003_a',
        description: 'First migration',
        up: async () => executionOrder.push('a'),
        down: async () => {}
      },
      {
        id: 'test_003_b',
        description: 'Second migration',
        up: async () => executionOrder.push('b'),
        down: async () => {}
      },
      {
        id: 'test_003_c',
        description: 'Third migration',
        up: async () => executionOrder.push('c'),
        down: async () => {}
      }
    ];

    migrationManager.registerMigrations(migrations);
    const count = await migrationManager.up();

    assert.equal(count, 3);
    assert.deepEqual(executionOrder, ['a', 'b', 'c']);
  });

  it('Should rollback last migration with down', async () => {
    let upExecuted = false;
    let downExecuted = false;

    const migration = {
      id: 'test_004',
      description: 'Rollback test',
      up: async () => {
        upExecuted = true;
      },
      down: async () => {
        downExecuted = true;
      }
    };

    migrationManager.registerMigration(migration);
    await migrationManager.up();

    assert.isTrue(upExecuted);
    assert.isFalse(downExecuted);

    const result = await migrationManager.down();
    assert.isTrue(result);
    assert.isTrue(downExecuted);

    const pending = await migrationManager.getPendingMigrations();
    assert.equal(pending.length, 1);
  });

  it('Should return false when trying to rollback with no migrations applied', async () => {
    const result = await migrationManager.down();
    assert.isFalse(result);
  });

  it('Should rollback multiple migrations with downMultiple', async () => {
    const migrations = [
      {
        id: 'test_005_a',
        description: 'First',
        up: async () => {},
        down: async () => {}
      },
      {
        id: 'test_005_b',
        description: 'Second',
        up: async () => {},
        down: async () => {}
      },
      {
        id: 'test_005_c',
        description: 'Third',
        up: async () => {},
        down: async () => {}
      }
    ];

    migrationManager.registerMigrations(migrations);
    await migrationManager.up();

    const rolledBack = await migrationManager.downMultiple(2);
    assert.equal(rolledBack, 2);

    const pending = await migrationManager.getPendingMigrations();
    assert.equal(pending.length, 2);
  });

  it('Should get migration status', async () => {
    const migrations = [
      {
        id: 'test_006_a',
        description: 'First',
        up: async () => {},
        down: async () => {}
      },
      {
        id: 'test_006_b',
        description: 'Second',
        up: async () => {},
        down: async () => {}
      }
    ];

    migrationManager.registerMigrations(migrations);

    // Apply first migration only
    migrationManager.registerMigrations([migrations[0]]);
    const tempManager = new MigrationManager(adapter.connection, false);
    tempManager.registerMigration(migrations[0]);
    await tempManager.up();

    // Check status
    const status = await migrationManager.getStatus();
    assert.equal(status.length, 2);
    assert.equal(status[0].id, 'test_006_a');
    assert.isTrue(status[0].applied);
    assert.equal(status[1].id, 'test_006_b');
    assert.isFalse(status[1].applied);
  });

  it('Should throw error when ensureMigrations called with pending migrations', async () => {
    const migration = {
      id: 'test_007',
      description: 'Pending migration',
      up: async () => {},
      down: async () => {}
    };

    migrationManager.registerMigration(migration);

    try {
      await migrationManager.ensureMigrations();
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.include(err.message, 'pending migration');
    }
  });

  it('Should not throw error when ensureMigrations called with all migrations applied', async () => {
    const migration = {
      id: 'test_008',
      description: 'Applied migration',
      up: async () => {},
      down: async () => {}
    };

    migrationManager.registerMigration(migration);
    await migrationManager.up();

    await assert.isFulfilled(migrationManager.ensureMigrations());
  });

  it('Should execute migrations with transactions when enabled', async () => {
    const syncedAdapter = await createAdapter(true);
    const syncedManager = new MigrationManager(syncedAdapter.connection, true);

    let executed = false;
    const migration = {
      id: 'test_009',
      description: 'Transaction test',
      up: async (connection, session) => {
        assert.isDefined(session);
        executed = true;
      },
      down: async () => {}
    };

    syncedManager.registerMigration(migration);
    await syncedManager.up();

    assert.isTrue(executed);
    await syncedAdapter.close();
  });

  it('Should rollback migration on error during up', async () => {
    const migration = {
      id: 'test_010',
      description: 'Error test',
      up: async () => {
        throw new Error('Migration failed');
      },
      down: async () => {}
    };

    migrationManager.registerMigration(migration);

    try {
      await migrationManager.up();
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.equal(err.message, 'Migration failed');
    }

    // Migration should not be recorded
    const pending = await migrationManager.getPendingMigrations();
    assert.equal(pending.length, 1);
  });
});
