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
const MongooseAdapter = require('../../src/adapter');
const model = path.resolve(__dirname, '../fixtures/basic_model.conf');
const policy = path.resolve(__dirname, '../fixtures/policy.csv');

const MONGOOSE_OPTIONS = { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true };

async function createEnforcer () {
  const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin', MONGOOSE_OPTIONS);

  return newEnforcer(model, adapter);
};

async function createAdapter (noTransaction = false) {
  return MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin', MONGOOSE_OPTIONS, false, noTransaction);
};

module.exports = { createEnforcer, createAdapter, model, policy };
