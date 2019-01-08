const mongoose = require('mongoose');
const { Helper } = require('casbin');
const CasbinRule = require('./model');

class MongooseAdapter {
  /**
   * Creates a new instance of mongoose adapter for casbin.
   *
   * @param {String} uri Mongo URI where casbin rules must be persisted
   * @param {Object} [options={}] Additional options to pass on to mongoose client
   * @example
   * const adapter = new MongoAdapter('MONGO_URI');
   */
  constructor (uri, options = {}) {
    if (!uri || typeof uri !== 'string') {
      throw new Error('You must provide Mongo URI to connect to!');
    }

    mongoose.connect(uri, options);
  }

  /**
   * Creates a new instance of Mongo adapter for casbin.
   *
   * @static
   * @param {String} uri Mongo URI where casbin rules must be persisted
   * @param {Object} [options={}] Additional options to pass on to mongoose client
   * @example
   * const adapter = new MongoAdapter('MONGO_URI');
   */
  static async newAdapter (uri, options = {}) {
    const adapter = new MongooseAdapter(uri, options);
    await new Promise(resolve => mongoose.connection.once('connected', resolve));
    return adapter;
  }

  /**
   * Loads one policy rule into casbin model.
   *
   * @param {Object} line Record with one policy rule from MongoDB
   * @param {Object} model Casbin model to which policy rule must be loaded
   * @returns {void}
   */
  loadPolicyLine (line, model) {
    let lineText = line.p_type;

    if (line.v0) {
      lineText += ', ' + line.v0;
    }

    if (line.v1) {
      lineText += ', ' + line.v1;
    }

    if (line.v2) {
      lineText += ', ' + line.v2;
    }

    if (line.v3) {
      lineText += ', ' + line.v3;
    }

    if (line.v4) {
      lineText += ', ' + line.v4;
    }

    if (line.v5) {
      lineText += ', ' + line.v5;
    }

    Helper.loadPolicyLine(lineText, model);
  }

  /**
   * Implements the process of loading policy from database into enforcer.
   *
   * @param {Model} model Model instance from enforcer
   * @returns {Promise<void>}
   */
  async loadPolicy (model) {
    return this.loadFilteredPolicy(model, {});
  }

  /**
   * Loads partial policy based on filter criteria.
   *
   * @param {Model} model Enforcer model
   * @param {Object} filter MongoDB filter to query
   */
  async loadFilteredPolicy (model, filter = {}) {
    const lines = await CasbinRule.find(filter);

    for (const line of lines) {
      this.loadPolicyLine(line, model);
    }
  }

  /**
   * Persists one policy rule into MongoDB.
   *
   * @param {String} ptype Policy type to save into MongoDB
   * @param {Array<String>} rule An array which consists of policy rule elements to store
   * @returns {Object} Returns a created CasbinRule record for MongoDB
   */
  savePolicyLine (ptype, rule) {
    const model = new CasbinRule({ p_type: ptype });

    if (rule.length > 0) {
      model.v0 = rule[0];
    }

    if (rule.length > 1) {
      model.v1 = rule[1];
    }

    if (rule.length > 2) {
      model.v2 = rule[2];
    }

    if (rule.length > 3) {
      model.v3 = rule[3];
    }

    if (rule.length > 4) {
      model.v4 = rule[4];
    }

    if (rule.length > 5) {
      model.v5 = rule[5];
    }

    return model;
  }

  /**
   * Implements the process of saving policy from enforcer into database.
   *
   * @param {Model} model Model instance from enforcer
   * @returns {Promise<Boolean>}
   */
  async savePolicy (model) {
    const policyRuleAST = model.model.get('p');
    const groupingPolicyAST = model.model.get('g');

    for (const [ptype, ast] of policyRuleAST) {
      for (const rule of ast.policy) {
        const line = this.savePolicyLine(ptype, rule);
        await line.save();
      }
    }

    for (const [ptype, ast] of groupingPolicyAST) {
      for (const rule of ast.policy) {
        const line = this.savePolicyLine(ptype, rule);
        await line.save();
      }
    }

    return true;
  }

  /**
   * Implements the process of adding policy rule.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Array<String>} rule Policy rule to add into enforcer
   * @returns {Promise<void>}
   */
  async addPolicy (sec, ptype, rule) {
    const line = this.savePolicyLine(ptype, rule);
    await line.save();
  }

  /**
   * Implements the process of removing policy rule.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Array<String>} rule Policy rule to remove from enforcer
   * @returns {Promise<void>}
   */
  async removePolicy (sec, ptype, rule) {
    const { p_type, v0, v1, v2, v3, v4, v5 } = this.savePolicyLine(ptype, rule);
    await CasbinRule.deleteMany({ p_type, v0, v1, v2, v3, v4, v5 });
  }

  /**
   * Implements the process of removing policy rules.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Number} fieldIndex Index of the field to start filtering from
   * @param  {...String} fieldValues Policy rule to match when removing (starting from fieldIndex)
   * @returns {Promise<void>}
   */
  async removeFilteredPolicy (sec, ptype, fieldIndex, ...fieldValues) {
    const where = { p_type: ptype };

    if (fieldIndex <= 0 && fieldIndex + fieldValues.length > 0 && fieldValues[0 - fieldIndex]) {
      where.v0 = fieldValues[0 - fieldIndex];
    }

    if (fieldIndex <= 1 && fieldIndex + fieldValues.length > 1 && fieldValues[1 - fieldIndex]) {
      where.v1 = fieldValues[1 - fieldIndex];
    }

    if (fieldIndex <= 2 && fieldIndex + fieldValues.length > 2 && fieldValues[2 - fieldIndex]) {
      where.v2 = fieldValues[2 - fieldIndex];
    }

    if (fieldIndex <= 3 && fieldIndex + fieldValues.length > 3 && fieldValues[3 - fieldIndex]) {
      where.v3 = fieldValues[3 - fieldIndex];
    }

    if (fieldIndex <= 4 && fieldIndex + fieldValues.length > 4 && fieldValues[4 - fieldIndex]) {
      where.v4 = fieldValues[4 - fieldIndex];
    }

    if (fieldIndex <= 5 && fieldIndex + fieldValues.length > 5 && fieldValues[5 - fieldIndex]) {
      where.v5 = fieldValues[5 - fieldIndex];
    }

    await CasbinRule.deleteMany(where);
  }

  /**
   * Check if adapter is in filtered state.
   *
   * @returns {Boolean}
   */
  get isFiltered () {
    return true;
  }
}

module.exports = MongooseAdapter;
