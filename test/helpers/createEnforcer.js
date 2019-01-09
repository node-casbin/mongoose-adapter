const path = require('path');
const { newEnforcer } = require('casbin');
const MongooseAdapter = require('../..');

const MONGOOSE_OPTIONS = { useNewUrlParser: true, useCreateIndex: true };

module.exports = async function createEnforcer () {
  const model = path.resolve(__dirname, '../fixtures/basic_model.conf');
  const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin', MONGOOSE_OPTIONS);

  return newEnforcer(model, adapter);
};
