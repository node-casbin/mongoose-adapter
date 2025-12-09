# Migration System

The mongoose-adapter includes a built-in migration system to handle schema changes reliably. This guide explains how to use migrations to upgrade your Casbin database schema safely.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Migration Concepts](#migration-concepts)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Migrations provide a reliable way to evolve your Casbin schema over time. The migration system:

- **Tracks applied migrations** in a dedicated collection (`casbin_migrations`)
- **Supports transactions** when using MongoDB replica sets
- **Allows rollbacks** for safe downgrades
- **Auto-checks migrations** before adapter operations
- **Provides clear status** of pending and applied migrations

## Features

### 1. Transaction Support

When using MongoDB replica sets, migrations run within transactions. If a migration fails, all changes are automatically rolled back.

### 2. Up and Down Migrations

Each migration has both `up` (apply) and `down` (rollback) functions, allowing you to safely upgrade or downgrade your schema.

### 3. Automatic Migration Checking

By default, the adapter checks that all migrations are applied before loading policies. This prevents using an outdated schema.

### 4. Migration Tracking

All applied migrations are recorded in the `casbin_migrations` collection with:
- Migration ID
- Description
- Applied timestamp

## Quick Start

### Basic Usage

```javascript
const { MongooseAdapter } = require('casbin-mongoose-adapter');

// Create adapter (migrations auto-initialized)
const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin');

// Run pending migrations
const count = await adapter.runMigrations();
console.log(`Applied ${count} migrations`);

// Check migration status
const status = await adapter.getMigrationStatus();
status.forEach(m => {
  console.log(`${m.id}: ${m.applied ? '✓' : '✗'} ${m.description}`);
});
```

### Disabling Auto-Migration Checks

If you want to manage migrations manually:

```javascript
const adapter = await MongooseAdapter.newAdapter(
  'mongodb://localhost:27017/casbin',
  {},
  { skipMigrations: true }
);
```

## Migration Concepts

### Migration Structure

A migration is an object with the following structure:

```javascript
{
  id: '001_my_migration',           // Unique identifier
  description: 'Add new field',      // Human-readable description
  up: async (connection, session) => {
    // Apply changes
  },
  down: async (connection, session) => {
    // Rollback changes
  }
}
```

### Migration Execution Order

Migrations are executed in the order they are registered. The built-in migrations run first, followed by any custom migrations you add.

### Transaction Session

When transactions are enabled (replica sets), a MongoDB session is passed to `up` and `down` functions. Use it for all database operations:

```javascript
up: async (connection, session) => {
  const Model = connection.models.CasbinRule;
  await Model.updateMany(
    { /* query */ },
    { /* update */ },
    { session } // Use session for transactional operations
  );
}
```

## API Reference

### Adapter Methods

#### `runMigrations(): Promise<number>`

Runs all pending migrations. Returns the number of migrations executed.

```javascript
const count = await adapter.runMigrations();
```

#### `rollbackMigration(): Promise<boolean>`

Rolls back the last applied migration. Returns `true` if a migration was rolled back, `false` if none to rollback.

```javascript
const didRollback = await adapter.rollbackMigration();
```

#### `getMigrationStatus(): Promise<Array>`

Returns the status of all migrations.

```javascript
const status = await adapter.getMigrationStatus();
// Returns: [{ id: '001_...', description: '...', applied: true }, ...]
```

#### `ensureMigrations(): Promise<void>`

Verifies all migrations are applied. Throws an error if pending migrations exist. Called automatically before loading policies.

```javascript
await adapter.ensureMigrations();
```

### MigrationManager API

For advanced use cases, you can use the `MigrationManager` directly:

#### `registerMigration(migration)`

Register a single migration.

```javascript
migrationManager.registerMigration({
  id: 'custom_001',
  description: 'My custom migration',
  up: async (connection, session) => { /* ... */ },
  down: async (connection, session) => { /* ... */ }
});
```

#### `registerMigrations(migrations)`

Register multiple migrations at once.

```javascript
migrationManager.registerMigrations([migration1, migration2]);
```

#### `up(): Promise<number>`

Execute all pending migrations.

#### `down(): Promise<boolean>`

Rollback the last applied migration.

#### `downMultiple(count): Promise<number>`

Rollback multiple migrations.

```javascript
const rolledBack = await migrationManager.downMultiple(3);
```

#### `getPendingMigrations(): Promise<Array>`

Get all migrations that haven't been applied yet.

#### `getStatus(): Promise<Array>`

Get status of all registered migrations.

## Examples

### Example 1: Adding a New Field

```javascript
const migration = {
  id: '002_add_tenant_field',
  description: 'Add tenant field for multi-tenancy',
  up: async (connection, session) => {
    const CasbinRule = connection.models.CasbinRule;
    await CasbinRule.updateMany(
      { tenant: { $exists: false } },
      { $set: { tenant: 'default' } },
      session ? { session } : {}
    );
  },
  down: async (connection, session) => {
    const CasbinRule = connection.models.CasbinRule;
    await CasbinRule.updateMany(
      {},
      { $unset: { tenant: '' } },
      session ? { session } : {}
    );
  }
};
```

### Example 2: Adding Indexes

```javascript
const migration = {
  id: '003_add_performance_indexes',
  description: 'Add indexes for query performance',
  up: async (connection, session) => {
    const db = connection.db;
    await db.collection('casbin_rule').createIndex(
      { ptype: 1, v0: 1, v1: 1 },
      { background: true }
    );
  },
  down: async (connection, session) => {
    const db = connection.db;
    await db.collection('casbin_rule').dropIndex('ptype_1_v0_1_v1_1');
  }
};
```

### Example 3: Data Transformation

```javascript
const migration = {
  id: '004_normalize_policy_values',
  description: 'Normalize policy values to lowercase',
  up: async (connection, session) => {
    const CasbinRule = connection.models.CasbinRule;
    const rules = await CasbinRule.find({}, null, session ? { session } : {});

    for (const rule of rules) {
      if (rule.v0) rule.v0 = rule.v0.toLowerCase();
      if (rule.v1) rule.v1 = rule.v1.toLowerCase();
      await rule.save(session ? { session } : {});
    }
  },
  down: async (connection, session) => {
    // Reverting this would require storing original values
    // In practice, some migrations may not be easily reversible
    console.warn('Cannot automatically revert normalization');
  }
};
```

### Example 4: Custom Migration Manager

```javascript
const { MigrationManager } = require('casbin-mongoose-adapter');

const adapter = await MongooseAdapter.newAdapter(
  'mongodb://localhost:27017/casbin',
  {},
  { skipMigrations: true }
);

const migrationManager = new MigrationManager(adapter.connection, true);

// Register your custom migrations
migrationManager.registerMigrations([
  migration1,
  migration2,
  migration3
]);

// Run them
await migrationManager.up();
```

## Best Practices

### 1. Never Modify Applied Migrations

Once a migration has been applied in production, never modify it. Create a new migration instead.

### 2. Use Descriptive IDs

Use descriptive, sequential IDs for migrations:
- ✅ `001_initial_schema`
- ✅ `002_add_tenant_support`
- ❌ `migration1`
- ❌ `fix`

### 3. Test Migrations Thoroughly

Always test both `up` and `down` migrations:

```javascript
// Test up
await migrationManager.up();
// Verify changes

// Test down
await migrationManager.down();
// Verify rollback
```

### 4. Handle Edge Cases

Consider edge cases in your migrations:

```javascript
up: async (connection, session) => {
  const CasbinRule = connection.models.CasbinRule;

  // Check if field already exists
  const sample = await CasbinRule.findOne();
  if (sample && 'newField' in sample) {
    console.log('Field already exists, skipping...');
    return;
  }

  // Apply migration
  await CasbinRule.updateMany(
    { newField: { $exists: false } },
    { $set: { newField: 'default' } },
    session ? { session } : {}
  );
}
```

### 5. Use Transactions for Complex Changes

For multi-step migrations, use transactions (requires replica set):

```javascript
const adapter = await MongooseAdapter.newAdapter(
  'mongodb://localhost:27001,localhost:27002/db?replicaSet=rs0'
);

// Transactions ensure all-or-nothing execution
const migrationManager = new MigrationManager(adapter.connection, true);
```

### 6. Document Breaking Changes

If a migration introduces breaking changes, document them:

```javascript
{
  id: '005_remove_deprecated_field',
  description: 'BREAKING: Remove deprecated "oldField" column',
  up: async (connection, session) => {
    // Migration code
  },
  down: async (connection, session) => {
    // Rollback code
  }
}
```

### 7. Backup Before Major Migrations

Always backup your database before running migrations in production:

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/casbin" --out=/backup/casbin-$(date +%Y%m%d)

# Run migrations
node run-migrations.js

# If something goes wrong, restore
mongorestore --uri="mongodb://localhost:27017/casbin" /backup/casbin-YYYYMMDD
```

### 8. Version Your Migrations

Keep migrations in version control and deploy them with your application code.

### 9. Monitor Migration Performance

For large collections, monitor migration performance:

```javascript
up: async (connection, session) => {
  console.time('migration_003');

  const CasbinRule = connection.models.CasbinRule;
  const count = await CasbinRule.countDocuments();
  console.log(`Processing ${count} documents...`);

  // Run migration
  await CasbinRule.updateMany(/* ... */);

  console.timeEnd('migration_003');
}
```

## Troubleshooting

### Error: "There are X pending migration(s)"

This means migrations haven't been applied. Run:

```javascript
await adapter.runMigrations();
```

### Error: "Migration with ID 'X' is already registered"

You're trying to register a migration with a duplicate ID. Use a unique ID for each migration.

### Transactions Not Working

Transactions require a MongoDB replica set. If you're using a standalone MongoDB instance, set `useTransactions: false`:

```javascript
const migrationManager = new MigrationManager(adapter.connection, false);
```

## See Also

- [examples/migrations.js](../examples/migrations.js) - Complete working examples
- [src/migrations/](../src/migrations/) - Built-in migrations
- [MongoDB Transactions Documentation](https://docs.mongodb.com/manual/core/transactions/)
