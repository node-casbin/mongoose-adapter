#!/usr/bin/env node

/**
 * Migration CLI Tool
 *
 * This is a simple command-line tool to manage Casbin migrations.
 *
 * Usage:
 *   node migrate.js status     - Show migration status
 *   node migrate.js up         - Run pending migrations
 *   node migrate.js down       - Rollback last migration
 *   node migrate.js down 3     - Rollback last 3 migrations
 */

const { MongooseAdapter } = require('casbin-mongoose-adapter');

// Configuration - update these values for your setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/casbin';

async function showStatus (adapter) {
  const status = await adapter.getMigrationStatus();

  console.log('\nMigration Status:');
  console.log('================\n');

  if (status.length === 0) {
    console.log('No migrations registered.');
    return;
  }

  status.forEach((migration) => {
    const icon = migration.applied ? '✓' : '✗';
    const statusText = migration.applied ? 'Applied' : 'Pending';
    console.log(`${icon} ${migration.id}`);
    console.log(`  ${statusText}: ${migration.description}\n`);
  });

  const appliedCount = status.filter((m) => m.applied).length;
  const pendingCount = status.filter((m) => !m.applied).length;

  console.log(`Total: ${status.length} (${appliedCount} applied, ${pendingCount} pending)`);
}

async function runMigrations (adapter) {
  console.log('\nRunning migrations...\n');

  const count = await adapter.runMigrations();

  if (count === 0) {
    console.log('No pending migrations to run.');
  } else {
    console.log(`✓ Successfully applied ${count} migration(s).`);
  }
}

async function rollbackMigrations (adapter, count = 1) {
  console.log(`\nRolling back ${count} migration(s)...\n`);

  if (count === 1) {
    const result = await adapter.rollbackMigration();
    if (result) {
      console.log('✓ Successfully rolled back 1 migration.');
    } else {
      console.log('No migrations to rollback.');
    }
  } else {
    // For multiple rollbacks, use migration manager directly
    if (!adapter.migrationManager) {
      console.error('Error: Migration manager not available.');
      process.exit(1);
    }

    const rolledBack = await adapter.migrationManager.downMultiple(count);
    if (rolledBack > 0) {
      console.log(`✓ Successfully rolled back ${rolledBack} migration(s).`);
    } else {
      console.log('No migrations to rollback.');
    }
  }
}

async function main () {
  const command = process.argv[2];
  const arg = process.argv[3];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(`
Casbin Migration Tool

Usage:
  node migrate.js status          Show migration status
  node migrate.js up              Run pending migrations
  node migrate.js down            Rollback last migration
  node migrate.js down <count>    Rollback <count> migrations

Environment Variables:
  MONGO_URI    MongoDB connection URI (default: mongodb://localhost:27017/casbin)
    `);
    process.exit(0);
  }

  console.log(`Connecting to: ${MONGO_URI}`);

  let adapter;
  try {
    adapter = await MongooseAdapter.newAdapter(MONGO_URI);

    switch (command) {
      case 'status':
        await showStatus(adapter);
        break;

      case 'up':
        await runMigrations(adapter);
        await showStatus(adapter);
        break;

      case 'down': {
        const count = arg ? parseInt(arg, 10) : 1;
        if (isNaN(count) || count < 1) {
          console.error('Error: Invalid count. Must be a positive number.');
          process.exit(1);
        }
        await rollbackMigrations(adapter, count);
        await showStatus(adapter);
        break;
      }

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.error("Run 'node migrate.js help' for usage information.");
        process.exit(1);
    }

    console.log('\n✓ Done.\n');
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (adapter) {
      await adapter.close();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
