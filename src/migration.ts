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

import { ClientSession, Connection, Model as MongooseModel, Schema } from 'mongoose';

/**
 * Represents a single migration with up and down functions
 */
export interface Migration {
  /**
   * Unique identifier for the migration (e.g., '001_initial_schema')
   */
  id: string;

  /**
   * Human-readable description of what this migration does
   */
  description: string;

  /**
   * Execute the migration (upgrade)
   * @param connection MongoDB connection
   * @param session Optional session for transactions
   */
  up: (connection: Connection, session?: ClientSession) => Promise<void>;

  /**
   * Rollback the migration (downgrade)
   * @param connection MongoDB connection
   * @param session Optional session for transactions
   */
  down: (connection: Connection, session?: ClientSession) => Promise<void>;
}

/**
 * Interface for migration tracking document
 */
export interface IMigrationRecord {
  migrationId: string;
  appliedAt: Date;
  description: string;
}

/**
 * Schema for migration tracking collection
 */
const migrationRecordSchema = new Schema<IMigrationRecord>(
  {
    migrationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    appliedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    description: {
      type: String,
      required: true
    }
  },
  {
    collection: 'casbin_migrations',
    minimize: false
  }
);

/**
 * MigrationManager handles schema migrations for the Casbin adapter
 */
export class MigrationManager {
  private connection: Connection;
  private migrationModel: MongooseModel<IMigrationRecord>;
  private migrations: Migration[] = [];
  private useTransactions: boolean;

  constructor(connection: Connection, useTransactions: boolean = true) {
    this.connection = connection;
    this.useTransactions = useTransactions;
    this.migrationModel = this.connection.model<IMigrationRecord>(
      'CasbinMigration',
      migrationRecordSchema,
      'casbin_migrations'
    );
  }

  /**
   * Register a migration to be managed
   * @param migration Migration to register
   */
  registerMigration(migration: Migration): void {
    // Ensure no duplicate migration IDs
    if (this.migrations.some((m) => m.id === migration.id)) {
      throw new Error(`Migration with ID '${migration.id}' is already registered`);
    }
    this.migrations.push(migration);
  }

  /**
   * Register multiple migrations
   * @param migrations Array of migrations to register
   */
  registerMigrations(migrations: Migration[]): void {
    migrations.forEach((m) => this.registerMigration(m));
  }

  /**
   * Get all applied migrations from the database
   * @returns Array of applied migration IDs
   */
  private async getAppliedMigrations(): Promise<string[]> {
    const records = await this.migrationModel.find({}).sort({ appliedAt: 1 }).lean();
    return records.map((r) => r.migrationId);
  }

  /**
   * Get pending migrations that haven't been applied yet
   * @returns Array of pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    return this.migrations.filter((m) => !applied.includes(m.id));
  }

  /**
   * Run all pending migrations
   * @returns Number of migrations executed
   */
  async up(): Promise<number> {
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      return 0;
    }

    let count = 0;
    for (const migration of pending) {
      await this.runMigration(migration, 'up');
      count++;
    }

    return count;
  }

  /**
   * Rollback the last applied migration
   * @returns True if a migration was rolled back, false if none to rollback
   */
  async down(): Promise<boolean> {
    const applied = await this.getAppliedMigrations();

    if (applied.length === 0) {
      return false;
    }

    const lastMigrationId = applied[applied.length - 1];
    const migration = this.migrations.find((m) => m.id === lastMigrationId);

    if (!migration) {
      throw new Error(
        `Migration '${lastMigrationId}' was applied but not found in registered migrations`
      );
    }

    await this.runMigration(migration, 'down');
    return true;
  }

  /**
   * Rollback multiple migrations
   * @param count Number of migrations to rollback
   * @returns Number of migrations rolled back
   */
  async downMultiple(count: number): Promise<number> {
    let rolledBack = 0;
    for (let i = 0; i < count; i++) {
      const result = await this.down();
      if (result) {
        rolledBack++;
      } else {
        break;
      }
    }
    return rolledBack;
  }

  /**
   * Execute a migration (up or down)
   * @param migration Migration to execute
   * @param direction 'up' or 'down'
   */
  private async runMigration(migration: Migration, direction: 'up' | 'down'): Promise<void> {
    // Determine if we should use transactions
    const shouldUseTransaction = this.useTransactions && this.supportsTransactions();

    if (shouldUseTransaction) {
      const session = await this.connection.startSession();
      try {
        await session.startTransaction();

        // Execute the migration
        await migration[direction](this.connection, session);

        // Update migration tracking
        if (direction === 'up') {
          await this.migrationModel.create(
            [
              {
                migrationId: migration.id,
                description: migration.description,
                appliedAt: new Date()
              }
            ],
            { session }
          );
        } else {
          await this.migrationModel.deleteOne({ migrationId: migration.id }, { session });
        }

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    } else {
      // Run without transactions
      await migration[direction](this.connection);

      // Update migration tracking
      if (direction === 'up') {
        await this.migrationModel.create({
          migrationId: migration.id,
          description: migration.description,
          appliedAt: new Date()
        });
      } else {
        await this.migrationModel.deleteOne({ migrationId: migration.id });
      }
    }
  }

  /**
   * Check if the connection supports transactions (replica set required)
   * Note: This is a simplified check. Actual transaction support is verified
   * when starting a transaction, which will fail if not supported.
   * @returns True (assumes transactions are supported; actual check happens at runtime)
   */
  private supportsTransactions(): boolean {
    // Transactions require MongoDB replica sets or sharded clusters
    // The actual capability check happens when startSession/startTransaction is called
    // which will throw an error if transactions are not supported
    return true;
  }

  /**
   * Ensure all registered migrations have been applied
   * This should be called before the adapter becomes operational
   * @throws Error if there are pending migrations
   */
  async ensureMigrations(): Promise<void> {
    const pending = await this.getPendingMigrations();
    if (pending.length > 0) {
      const pendingIds = pending.map((m) => m.id).join(', ');
      throw new Error(
        `There are ${pending.length} pending migration(s): ${pendingIds}. Please run migrations before using the adapter.`
      );
    }
  }

  /**
   * Get the status of all migrations
   * @returns Array of migration statuses
   */
  async getStatus(): Promise<Array<{ id: string; description: string; applied: boolean }>> {
    const applied = await this.getAppliedMigrations();
    return this.migrations.map((m) => ({
      id: m.id,
      description: m.description,
      applied: applied.includes(m.id)
    }));
  }
}
