// Example: Using the migration system in mongoose-adapter
// This example shows how to use migrations to manage schema changes

const { MongooseAdapter, MigrationManager } = require('casbin-mongoose-adapter');
const { newEnforcer } = require('casbin');

async function example1BasicMigrationUsage () {
  console.log('\n=== Example 1: Basic Migration Usage ===\n');

  // Create adapter (migrations are auto-initialized by default)
  const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin');

  try {
    // Check migration status
    const status = await adapter.getMigrationStatus();
    console.log('Migration status:');
    status.forEach((s) => {
      console.log(`  - ${s.id}: ${s.applied ? '✓ Applied' : '✗ Pending'}`);
    });

    // Run pending migrations
    const count = await adapter.runMigrations();
    console.log(`\nRan ${count} migration(s)`);

    // Verify all migrations are applied
    await adapter.ensureMigrations();
    console.log('All migrations are up to date!');
  } finally {
    await adapter.close();
  }
}

async function example2CustomMigrations () {
  console.log('\n=== Example 2: Custom Migrations ===\n');

  const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin', {}, {
    skipMigrations: true // We'll manage migrations manually
  });

  try {
    // Create a custom migration manager
    const migrationManager = new MigrationManager(adapter.connection, false);

    // Define custom migrations
    const customMigrations = [
      {
        id: '001_add_tenant_field',
        description: 'Add tenant field to support multi-tenancy',
        up: async (connection, session) => {
          console.log('Running migration: Add tenant field');
          const CasbinRule = connection.models.CasbinRule;
          // Add tenant field to all existing rules with default value
          await CasbinRule.updateMany(
            { tenant: { $exists: false } },
            { $set: { tenant: 'default' } },
            session ? { session } : {}
          );
        },
        down: async (connection, session) => {
          console.log('Rolling back: Remove tenant field');
          const CasbinRule = connection.models.CasbinRule;
          // Remove tenant field from all rules
          await CasbinRule.updateMany(
            {},
            { $unset: { tenant: '' } },
            session ? { session } : {}
          );
        }
      },
      {
        id: '002_add_indexes',
        description: 'Add indexes for better query performance',
        up: async (connection, session) => {
          console.log('Running migration: Add indexes');
          const db = connection.db;
          // Add compound index on ptype and v0
          await db.collection('casbin_rule').createIndex(
            { ptype: 1, v0: 1 },
            { background: true }
          );
        },
        down: async (connection, session) => {
          console.log('Rolling back: Remove indexes');
          const db = connection.db;
          // Drop the compound index
          await db.collection('casbin_rule').dropIndex('ptype_1_v0_1');
        }
      }
    ];

    // Register custom migrations
    migrationManager.registerMigrations(customMigrations);

    // Get pending migrations
    const pending = await migrationManager.getPendingMigrations();
    console.log(`Found ${pending.length} pending migration(s)`);

    // Run all pending migrations
    const count = await migrationManager.up();
    console.log(`Applied ${count} migration(s)`);

    // Get updated status
    const status = await migrationManager.getStatus();
    console.log('\nMigration status:');
    status.forEach((s) => {
      console.log(`  - ${s.id}: ${s.applied ? '✓' : '✗'} ${s.description}`);
    });
  } finally {
    await adapter.close();
  }
}

async function example3RollbackMigrations () {
  console.log('\n=== Example 3: Rollback Migrations ===\n');

  const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin');

  try {
    // Ensure migrations are applied first
    await adapter.runMigrations();

    console.log('Current migration status:');
    let status = await adapter.getMigrationStatus();
    status.forEach((s) => {
      console.log(`  - ${s.id}: ${s.applied ? '✓' : '✗'}`);
    });

    // Rollback the last migration
    console.log('\nRolling back last migration...');
    const didRollback = await adapter.rollbackMigration();

    if (didRollback) {
      console.log('Successfully rolled back migration');

      status = await adapter.getMigrationStatus();
      console.log('\nUpdated migration status:');
      status.forEach((s) => {
        console.log(`  - ${s.id}: ${s.applied ? '✓' : '✗'}`);
      });
    } else {
      console.log('No migrations to rollback');
    }
  } finally {
    await adapter.close();
  }
}

async function example4TransactionalMigrations () {
  console.log('\n=== Example 4: Transactional Migrations (Replica Set) ===\n');

  // Note: Transactions require a MongoDB replica set
  const adapter = await MongooseAdapter.newAdapter(
    'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0',
    {},
    {
      skipMigrations: true
    }
  );

  try {
    // Create migration manager with transactions enabled
    const migrationManager = new MigrationManager(adapter.connection, true);

    // Define a migration that uses transactions
    const migration = {
      id: '003_complex_schema_change',
      description: 'Complex schema change with multiple operations',
      up: async (connection, session) => {
        console.log('Running complex migration with transaction...');
        const CasbinRule = connection.models.CasbinRule;

        // Multiple operations in a transaction
        // If any operation fails, all will be rolled back
        await CasbinRule.updateMany(
          { ptype: 'p' },
          { $set: { updatedAt: new Date() } },
          { session }
        );

        await CasbinRule.updateMany(
          { ptype: 'g' },
          { $set: { updatedAt: new Date() } },
          { session }
        );

        console.log('Transaction will be committed automatically');
      },
      down: async (connection, session) => {
        console.log('Rolling back complex migration with transaction...');
        const CasbinRule = connection.models.CasbinRule;
        await CasbinRule.updateMany(
          {},
          { $unset: { updatedAt: '' } },
          { session }
        );
      }
    };

    migrationManager.registerMigration(migration);

    console.log('Running migration with transaction support...');
    await migrationManager.up();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed and was rolled back:', error.message);
  } finally {
    await adapter.close();
  }
}

async function example5IntegrationWithEnforcer () {
  console.log('\n=== Example 5: Integration with Casbin Enforcer ===\n');

  // Create adapter - migrations will be auto-checked on first policy load
  const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin');

  try {
    // When you create an enforcer, migrations are automatically checked
    // during loadPolicy()
    const enforcer = await newEnforcer('./model.conf', adapter);

    console.log('Enforcer created successfully!');
    console.log('Migrations were automatically verified during initialization');

    // Use the enforcer normally
    await enforcer.addPolicy('alice', 'data1', 'read');
    const hasPolicy = await enforcer.enforce('alice', 'data1', 'read');
    console.log(`\nCan alice read data1? ${hasPolicy}`);
  } catch (error) {
    if (error.message.includes('pending migration')) {
      console.error('Error: There are pending migrations!');
      console.error('Please run migrations first:');
      console.error('  await adapter.runMigrations();');
    } else {
      throw error;
    }
  } finally {
    await adapter.close();
  }
}

// Run examples
/* async function main () {
  try {
    // Uncomment the examples you want to run

    // await example1BasicMigrationUsage();
    // await example2CustomMigrations();
    // await example3RollbackMigrations();
    // await example4TransactionalMigrations(); // Requires replica set
    // await example5IntegrationWithEnforcer();

    console.log('\n=== Examples completed ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}
*/

// Uncomment to run:
// main();

module.exports = {
  example1BasicMigrationUsage,
  example2CustomMigrations,
  example3RollbackMigrations,
  example4TransactionalMigrations,
  example5IntegrationWithEnforcer
};
