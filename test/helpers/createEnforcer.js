const { Enforcer } = require('casbin');
const Adapter = require('../..');

const BASIC_MODEL = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
`;

module.exports = async function createEnforcer () {
  const adapter = await Adapter.newAdapter('mongodb://localhost:27017/casbin');

  return Enforcer.newEnforcer(BASIC_MODEL, adapter);
};
