const path = require('path');
const { newEnforcer } = require('casbin');
const Adapter = require('../..');

module.exports = async function createEnforcer () {
  const model = path.resolve(__dirname, '../fixtures/basic_model.conf');
  const adapter = await Adapter.newAdapter('mongodb://localhost:27017/casbin');

  return newEnforcer(model, adapter);
};
