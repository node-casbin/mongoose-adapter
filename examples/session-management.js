// Example: Using Session Management with newSyncedAdapter
// This example demonstrates proper session management for MongoDB transactions

const { MongooseAdapter } = require('casbin-mongoose-adapter');

async function exampleManualTransactionControl () {
  console.log('Example 1: Manual Transaction Control');
  console.log('=====================================\n');

  // Create a synced adapter without autoCommit/autoAbort
  const adapter = await MongooseAdapter.newSyncedAdapter(
    'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0',
    {},
    false, // autoAbort
    false // autoCommit
  );

  try {
    // Get the current session
    const session = await adapter.getSession();
    console.log('Session created:', session.id);

    // Start a transaction
    await adapter.getTransaction();
    console.log('Transaction started');

    // Perform multiple operations
    await adapter.addPolicy('', 'p', ['alice', 'data1', 'read']);
    await adapter.addPolicy('', 'p', ['bob', 'data2', 'write']);
    console.log('Policies added');

    // You can also perform custom operations with the session
    const CasbinRule = adapter.getCasbinRule();
    await CasbinRule.collection.insertOne(
      { ptype: 'p', v0: 'charlie', v1: 'data3', v2: 'write' },
      { session }
    );
    console.log('Custom operation performed');

    // Commit the transaction
    await adapter.commitTransaction();
    console.log('Transaction committed and session ended\n');
  } catch (error) {
    console.error('Error occurred:', error.message);
    // Abort the transaction on error
    await adapter.abortTransaction();
    console.log('Transaction aborted and session ended\n');
  } finally {
    await adapter.close();
  }
}

async function exampleAutoCommit () {
  console.log('Example 2: Auto Commit Mode');
  console.log('============================\n');

  // Create a synced adapter with autoCommit enabled
  const adapter = await MongooseAdapter.newSyncedAdapter(
    'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0',
    {},
    true, // autoAbort
    true // autoCommit
  );

  try {
    // Each operation automatically commits and ends the session
    await adapter.addPolicy('', 'p', ['alice', 'data1', 'read']);
    console.log('Policy added and automatically committed');

    await adapter.addPolicy('', 'p', ['bob', 'data2', 'write']);
    console.log('Policy added and automatically committed\n');
  } catch (error) {
    console.error('Error occurred:', error.message);
    console.log('Transaction automatically aborted\n');
  } finally {
    await adapter.close();
  }
}

async function exampleSessionReuse () {
  console.log('Example 3: Session Lifecycle');
  console.log('=============================\n');

  const adapter = await MongooseAdapter.newSyncedAdapter(
    'mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0',
    {},
    false,
    false
  );

  try {
    // First transaction
    const session1 = await adapter.getTransaction();
    console.log('First session created:', session1.id);

    await adapter.addPolicy('', 'p', ['alice', 'data1', 'read']);
    await adapter.commitTransaction();
    console.log('First transaction committed, session ended');

    // Second transaction - creates a new session
    const session2 = await adapter.getTransaction();
    console.log('Second session created:', session2.id);
    console.log('Sessions are different:', session1.id !== session2.id);

    await adapter.addPolicy('', 'p', ['bob', 'data2', 'write']);
    await adapter.commitTransaction();
    console.log('Second transaction committed, session ended\n');
  } catch (error) {
    console.error('Error occurred:', error.message);
  } finally {
    await adapter.close();
  }
}

// Run examples - uncomment to execute
// async function main () {
//   try {
//     await exampleManualTransactionControl();
//     await exampleAutoCommit();
//     await exampleSessionReuse();
//   } catch (error) {
//     console.error('Failed to run examples:', error.message);
//     console.log('\nNote: These examples require a MongoDB replica set running at:');
//     console.log('mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0');
//   }
// }
//
// main();

module.exports = {
  exampleManualTransactionControl,
  exampleAutoCommit,
  exampleSessionReuse
};
