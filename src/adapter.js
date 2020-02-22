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

const { Helper } = require('casbin');
const mongoose = require('mongoose');
const CasbinRule = require('./model');

/**
 * Implements a policy adapter for casbin with MongoDB support.
 *
 * @class
 */
class MongooseAdapter {
  /**
   * Creates a new instance of mongoose adapter for casbin.
   * It does not wait for successfull connection to MongoDB.
   * So, if you want to have a possibility to wait until connection successful, use newAdapter instead.
   *
   * @constructor
   * @param {String} uri Mongo URI where casbin rules must be persisted
   * @param {Object} [options={}] Additional options to pass on to mongoose client
   * @example
   * const adapter = new MongooseAdapter('MONGO_URI');
   * const adapter = new MongooseAdapter('MONGO_URI', { mongoose_options: 'here' })
   */
  constructor (uri, options = {}) {
    if (!uri || typeof uri !== 'string') {
      throw new Error('You must provide Mongo URI to connect to!');
    }

    // by default, adapter is not filtered
    this.isFiltered = false;
    this.useTransaction = false;
    this.uri = uri;
    this.options = options;
    this.debug = false;
  }

  async _open () {
    await mongoose.connect(this.uri, this.options)
      .then(instance => {
        this.mongoseInstance = instance;
      });
  }

  /**
   * Creates a new instance of mongoose adapter for casbin.
   * Instead of constructor, it does wait for successfull connection to MongoDB.
   * Preferable way to construct an adapter instance, is to use this static method.
   *
   * @static
   * @param {String} uri Mongo URI where casbin rules must be persisted
   * @param {Object} [options={}] Additional options to pass on to mongoose client
   * @example
   * const adapter = await MongooseAdapter.newAdapter('MONGO_URI');
   * const adapter = await MongooseAdapter.newAdapter('MONGO_URI', { mongoose_options: 'here' });
   */
  static async newAdapter (uri, options = {}, filtered = false, useTransaction = false) {
    const adapter = new MongooseAdapter(uri, options);
    await adapter._open();
    adapter.setFiltered(filtered);
    adapter.setTransaction(useTransaction);
    return adapter;
  }

  /**
   * Creates a new instance of mongoose adapter for casbin.
   * It does the same as newAdapter, but it also sets a flag that this adapter is in filtered state.
   * That way, casbin will not call loadPolicy() automatically.
   *
   * @static
   * @param {String} uri Mongo URI where casbin rules must be persisted
   * @param {Object} [options={}] Additional options to pass on to mongoose client
   * @example
   * const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI');
   * const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI', { mongoose_options: 'here' });
   */
  static async newFilteredAdapter (uri, options = {}) {
    const adapter = await MongooseAdapter.newAdapter(uri, options, true);
    await adapter._open();

    return adapter;
  }

  /**
   * Creates a new instance of mongoose adapter for casbin.
   * It does the same as newAdapter, but it checks wether database is a replica set. If it is, it enables
   * transactions for the adapter.
   * Transactions are never commited automatically. You have to use commitTransaction to add pending changes.
   *
   * @static
   * @param {String} uri Mongo URI where casbin rules must be persisted
   * @param {Object} [options={}] Additional options to pass on to mongoose client
   * @example
   * const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI');
   * const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI', { mongoose_options: 'here' });
   */
  static async newSyncedAdapter (uri, options = {}) {
    if (typeof uri !== 'string' || !uri.includes('replicaSet')) {
      throw new Error('You must provide Mongo URI with replicaSet attribute to connect with synced adapter!');
    }
    const adapter = await MongooseAdapter.newAdapter(uri, options, false, true);
    return adapter;
  }

  /**
   * Switch adapter to (non)filtered state.
   * Casbin uses this flag to determine if it should load the whole policy from DB or not.
   *
   * @param {Boolean} [isFiltered=true] Flag that represents the current state of adapter (filtered or not)
   */
  setFiltered (isFiltered = true) {
    this.isFiltered = isFiltered;
  }

  setTransaction (transactioned = true) {
    const conn = this.mongoseInstance.connections[0];
    if (!transactioned) this.useTransaction = transactioned;
    else if (conn && conn.replica) this.useTransaction = transactioned;
    else throw Error('Tried to enable transactions for non-replicaset connection');
  }

  async getSession () {
    if (this.useTransaction) {
      this.session = this.session && !this.session.hasEnded() ? this.session : await CasbinRule.startSession();
      return this.session;
    } else throw Error('Tried to start a session for non-replicaset connection');
  }

  async getTransaction () {
    if (this.useTransaction) {
      try {
        const session = await this.getSession();
        await session.startTransaction();
        return session;
      } catch (error) {
        if (!error.message !== 'Transaction already in progress on this session.') throw error;
      }
    } else throw Error('Tried to start a session for non-replicaset connection');
  }

  async commitTransaction () {
    if (this.useTransaction) {
      const session = await this.getSession();
      await session.commitTransaction();
    } else throw Error('Tried to start a session for non-replicaset connection');
  }

  async abortTransaction () {
    if (this.useTransaction) {
      const session = await this.getSession();
      await session.abortTransaction();
    } else throw Error('Tried to start a session for non-replicaset connection');
  }

  setDebug () {
    this.debug = true;
  }

  /**
   * Loads one policy rule into casbin model.
   * This method is used by casbin and should not be called by user.
   *
   * @param {Object} line Record with one policy rule from MongoDB
   * @param {Object} model Casbin model to which policy rule must be loaded
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
   * This method is used by casbin and should not be called by user.
   *
   * @param {Model} model Model instance from enforcer
   * @returns {Promise<void>}
   */
  async loadPolicy (model) {
    return this.loadFilteredPolicy(model);
  }

  /**
   * Loads partial policy based on filter criteria.
   * This method is used by casbin and should not be called by user.
   *
   * @param {Model} model Enforcer model
   * @param {Object} [filter] MongoDB filter to query
   */
  async loadFilteredPolicy (model, filter) {
    if (filter) {
      this.setFiltered(true);
    } else {
      this.setFiltered(false);
    }
    const options = {};
    if (this.useTransaction) options.session = await this.getTransaction();
    const lines = await CasbinRule.find(filter || {}, null, options);
    for (const line of lines) {
      this.loadPolicyLine(line, model);
    }
  }

  /**
   * Persists one policy rule into MongoDB.
   * This method is used by casbin and should not be called by user.
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
   * If you are using replica sets with mongo, this function will use mongo
   * transaction, so every line in the policy needs tosucceed for this to
   * take effect.
   * This method is used by casbin and should not be called by user.
   *
   * @param {Model} model Model instance from enforcer
   * @returns {Promise<Boolean>}
   */
  async savePolicy (model) {
    const options = {};
    if (this.useTransaction) {
      options.session = await this.getTransaction();
    }

    try {
      const lines = [];
      const policyRuleAST = model.model.get('p') instanceof Map ? model.model.get('p') : new Map();
      const groupingPolicyAST = model.model.get('g') instanceof Map ? model.model.get('g') : new Map();

      for (const [ptype, ast] of policyRuleAST) {
        for (const rule of ast.policy) {
          lines.push(this.savePolicyLine(ptype, rule));
        }
      }

      for (const [ptype, ast] of groupingPolicyAST) {
        for (const rule of ast.policy) {
          lines.push(this.savePolicyLine(ptype, rule));
        }
      }

      await CasbinRule.collection.insertMany(lines, options);
    } catch (err) {
      options.session && await options.session.abortTransaction();
      throw err;
    } finally {
      if (options.session && this.debug) console.log('Lines added to transaction, but it\'s not commited yet.');
    }

    return true;
  }

  /**
   * Implements the process of adding policy rule.
   * This method is used by casbin and should not be called by user.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Array<String>} rule Policy rule to add into enforcer
   * @returns {Promise<void>}
   */
  async addPolicy (sec, ptype, rule) {
    const line = this.savePolicyLine(ptype, rule);
    const options = {};
    if (this.useTransaction) options.session = await this.getTransaction();
    await line.save(options);
    if (this.useTransaction && this.debug) console.log('Line added to transaction, but it\'s not commited yet.');
  }

  /**
   * Implements the process of removing policy rule.
   * This method is used by casbin and should not be called by user.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Array<String>} rule Policy rule to remove from enforcer
   * @returns {Promise<void>}
   */
  async removePolicy (sec, ptype, rule) {
    const { p_type, v0, v1, v2, v3, v4, v5 } = this.savePolicyLine(ptype, rule);
    const options = {};
    if (this.useTransaction) options.session = await this.getTransaction();
    await CasbinRule.deleteMany({ p_type, v0, v1, v2, v3, v4, v5 }, options);
    if (this.useTransaction && this.debug) console.log('Line added to transaction, but it\'s not commited yet.');
  }

  /**
   * Implements the process of removing policy rules.
   * This method is used by casbin and should not be called by user.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Number} fieldIndex Index of the field to start filtering from
   * @param  {...String} fieldValues Policy rule to match when removing (starting from fieldIndex)
   * @returns {Promise<void>}
   */
  async removeFilteredPolicy (sec, ptype, fieldIndex, ...fieldValues) {
    const where = ptype ? { p_type: ptype } : {};

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
    const options = {};
    if (this.useTransaction) options.session = await this.getTransaction();
    await CasbinRule.deleteMany(where, options);
    if (this.useTransaction && this.debug) console.log('Lines deleted in transaction, but it\'s not commited yet.');
  }

  async close () {
    if (this.mongoseInstance && this.mongoseInstance.connection) {
      if (this.session) await this.session.endSession();
      await this.mongoseInstance.connection.close();
    }
  }
}

module.exports = MongooseAdapter;
