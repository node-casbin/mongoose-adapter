const createEnforcer = require('../helpers/createEnforcer');

describe('Casbin', () => {
  it('Should properly instantiate adapter and connect to mongo', async () => {
    const enforcer = await createEnforcer();
  });
});
