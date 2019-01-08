const path = require('path');
const { newEnforcer } = require('casbin');
const MongooseAdapter = require('../..');

module.exports = async function createEnforcer () {
  const model = path.resolve(__dirname, '../fixtures/basic_model.conf');
  const adapter = await MongooseAdapter.newAdapter('mongodb://localhost:27017/casbin');

  return newEnforcer(model, adapter);
};
