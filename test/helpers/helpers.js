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

const path = require('path');
const { newEnforcer } = require('casbin');
const { MongooseAdapter } = require('../../lib/cjs');
const basicModel = path.resolve(__dirname, '../fixtures/basic_model.conf');
const basicPolicy = path.resolve(__dirname, '../fixtures/basic_policy.csv');
const rbacModel = path.resolve(__dirname, '../fixtures/rbac_model.conf');
const rbacPolicy = path.resolve(__dirname, '../fixtures/rbac_policy.csv');
const rbacDenyDomainModel = path.resolve(__dirname, '../fixtures/rbac_with_domains_with_deny_model.conf');
const rbacDenyDomainPolicy = path.resolve(__dirname, '../fixtures/rbac_with_domains_with_deny_policy.csv');

async function createEnforcer () {
  const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0');

  return newEnforcer(basicModel, adapter);
}

async function createAdapter (useTransaction = false) {
  return MongooseAdapter.newAdapter('mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0', {}, {
    filtered: false,
    synced: useTransaction
  });
}

async function createAdapterWithDBName (dbName, useTransaction = false) {
  return MongooseAdapter.newAdapter('mongodb://localhost:27001,localhost:27002?replicaSet=rs0', {
    dbName: dbName
  }, {
    filtered: false,
    synced: useTransaction
  });
}

async function createSyncedAdapter () {
  const adapter = MongooseAdapter.newSyncedAdapter('mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return adapter;
}

async function createDisconnectedAdapter () {
  return new MongooseAdapter('mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0');
}

async function createAdapterWithCustomCollectionName (collectionName, useTransaction = false) {
  return MongooseAdapter.newAdapter('mongodb://localhost:27001,localhost:27002/casbin?replicaSet=rs0', {}, {
    filtered: false,
    synced: useTransaction,
    collectionName: collectionName
  });
}

module.exports = {
  createEnforcer,
  createAdapter,
  createAdapterWithDBName,
  createSyncedAdapter,
  createDisconnectedAdapter,
  createAdapterWithCustomCollectionName,
  basicModel,
  basicPolicy,
  rbacModel,
  rbacPolicy,
  rbacDenyDomainModel,
  rbacDenyDomainPolicy
};
