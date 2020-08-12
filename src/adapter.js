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

const { Helper, logPrint } = require('casbin');
const mongoose = require('mongoose');
const CasbinRule = require('./model');
const { AdapterError, InvalidAdapterTypeError } = require('./errors');

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
      throw new AdapterError('You must provide Mongo URI to connect to!');
    }

    // by default, adapter is not filtered
    this.filtered = false;
    this.isSynced = false;
    this.autoAbort = false;
    this.uri = uri;
    this.options = options;
  }

  /**
   * Opens a connection to mongoDB
   * @returns {Promise<void>}
   */
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
   * @param {Object} [adapterOptions={}] Additional options to pass on to adapter
   * @example
   * const adapter = await MongooseAdapter.newAdapter('MONGO_URI');
   * const adapter = await MongooseAdapter.newAdapter('MONGO_URI', { mongoose_options: 'here' });
   */
  static async newAdapter (uri, options = {}, adapterOptions = {}) {
    const adapter = new MongooseAdapter(uri, options);
    await adapter._open();
    const { filtered = false, synced = false, autoAbort = false, autoCommit = false } = adapterOptions;
    adapter.setFiltered(filtered);
    adapter.setSynced(synced);
    adapter.setAutoAbort(autoAbort);
    adapter.setAutoCommit(autoCommit);
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
    const adapter = await MongooseAdapter.newAdapter(uri, options, { filtered: true });
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
   * @param {Boolean} autoAbort Whether to abort transactions on Error automatically
   * @example
   * const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI');
   * const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI', { mongoose_options: 'here' });
   */
  static async newSyncedAdapter (uri, options = {}, autoAbort = true, autoCommit = true) {
    const adapter = await MongooseAdapter.newAdapter(uri, options, { synced: true, autoAbort, autoCommit });
    return adapter;
  }

  /**
   * Switch adapter to (non)filtered state.
   * Casbin uses this flag to determine if it should load the whole policy from DB or not.
   *
   * @param {Boolean} [enable=true] Flag that represents the current state of adapter (filtered or not)
   */
  setFiltered (enable = true) {
    this.filtered = enable;
  }

  /**
   * isFiltered determines whether the filtered model is enabled for the adapter.
   * @returns {boolean}
   */
  isFiltered () {
    return this.filtered;
  }

  /**
   * SyncedAdapter: Switch adapter to (non)synced state.
   * This enables mongoDB transactions when loading and saving policies to DB.
   *
   * @param {Boolean} [synced=true] Flag that represents the current state of adapter (filtered or not)
   */
  setSynced (synced = true) {
    this.isSynced = synced;
  }

  /**
   * SyncedAdapter: Automatically abort on Error.
   * When enabled, functions will automatically abort on error
   *
   * @param {Boolean} [abort=true] Flag that represents if automatic abort should be enabled or not
   */
  setAutoAbort (abort = true) {
    if (this.isSynced) this.autoAbort = abort;
  }

  /**
   * SyncedAdapter: Automatically commit after each addition.
   * When enabled, functions will automatically commit after function has finished
   *
   * @param {Boolean} [commit=true] Flag that represents if automatic commit should be enabled or not
   */
  setAutoCommit (commit = true) {
    if (this.isSynced) this.autoCommit = commit;
  }

  /**
   * SyncedAdapter: Gets active session or starts a new one. Sessions are used to handle transactions.
   * @returns {Promise<Session>}
   */
  async getSession () {
    if (this.isSynced) {
      return this.session && !this.session.hasEnded() ? this.session : this.mongoseInstance.startSession();
    } else throw new InvalidAdapterTypeError('Transactions are only supported by SyncedAdapter. See newSyncedAdapter');
  }

  /**
   * SyncedAdapter: Sets current session to specific one. Do not use this unless you know what you are doing.
   */
  async setSession (session) {
    if (this.isSynced) {
      if (session && (session.hasEnded && session.hasEnded.constructor && session.hasEnded.call && session.hasEnded.apply) && !session.hasEnded()) {
        this.session = session;
      } else {
        throw new AdapterError('Tried to set an invalid session');
      }
    } else {
      throw new InvalidAdapterTypeError('Sessions are only supported by SyncedAdapter. See newSyncedAdapter');
    }
  }

  /**
   * SyncedAdapter: Gets active transaction or starts a new one. Transaction must be closed before changes are done
   * to the database. See: commitTransaction, abortTransaction
   * @returns {Promise<Session>} Returns a session with active transaction
   */
  async getTransaction () {
    if (this.isSynced) {
      const session = await this.getSession();
      if (!session.transaction.isActive) {
        await session.startTransaction();
        logPrint('Transaction started. To commit changes use adapter.commitTransaction() or to abort use adapter.abortTransaction()');
      }
      return session;
    } else throw new InvalidAdapterTypeError('Transactions are only supported by SyncedAdapter. See newSyncedAdapter');
  }

  /**
   * SyncedAdapter: Commits active transaction. Documents are not saved before this function is used.
   * Transaction closes after the use of this function.
   * @returns {Promise<void>}
   */
  async commitTransaction () {
    if (this.isSynced) {
      const session = await this.getSession();
      await session.commitTransaction();
    } else throw new InvalidAdapterTypeError('Transactions are only supported by SyncedAdapter. See newSyncedAdapter');
  }

  /**
   * SyncedAdapter: Aborts active transaction. All Document changes within this transaction are reverted.
   * Transaction closes after the use of this function.
   * @returns {Promise<void>}
   */
  async abortTransaction () {
    if (this.isSynced) {
      const session = await this.getSession();
      await session.abortTransaction();
      logPrint('Transaction aborted');
    } else throw new InvalidAdapterTypeError('Transactions are only supported by SyncedAdapter. See newSyncedAdapter');
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
    if (this.isSynced) options.session = await this.getTransaction();

    const lines = await CasbinRule.find(filter || {}, null, options);

    this.autoCommit && options.session && await options.session.commitTransaction();
    for (const line of lines) {
      this.loadPolicyLine(line, model);
    }
  }

  /**
   * Generates one policy rule ready to be saved into MongoDB.
   * This method is used by casbin to generate Mongoose Model Object for single policy
   * and should not be called by user.
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
    if (this.isSynced) options.session = await this.getTransaction();

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

      this.autoCommit && options.session && await options.session.commitTransaction();
    } catch (err) {
      this.autoAbort && options.session && await options.session.abortTransaction();
      console.error(err);
      return false;
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
    const options = {};
    try {
      if (this.isSynced) options.session = await this.getTransaction();

      const line = this.savePolicyLine(ptype, rule);
      await line.save(options);

      this.autoCommit && options.session && await options.session.commitTransaction();
    } catch (err) {
      this.autoAbort && options.session && await options.session.abortTransaction();
      throw err;
    }
  }

  /**
   * Implements the process of adding a list of policy rules.
   * This method is used by casbin and should not be called by user.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Array<String>} rule Policy rule to add into enforcer
   * @returns {Promise<void>}
   */
  async addPolicies (sec, ptype, rules) {
    const options = {};
    if (this.isSynced) options.session = await this.getTransaction();
    else throw new InvalidAdapterTypeError('addPolicies is only supported by SyncedAdapter. See newSyncedAdapter');
    try {
      const promises = rules.map(async rule => this.addPolicy(sec, ptype, rule));
      await Promise.all(promises);

      this.autoCommit && options.session && await options.session.commitTransaction();
    } catch (err) {
      this.autoAbort && options.session && await options.session.abortTransaction();
      throw err;
    }
  }

  /**
   * Implements the process of removing a list of policy rules.
   * This method is used by casbin and should not be called by user.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Array<String>} rule Policy rule to remove from enforcer
   * @returns {Promise<void>}
   */
  async removePolicy (sec, ptype, rule) {
    const options = {};
    try {
      if (this.isSynced) options.session = await this.getTransaction();

      const { p_type, v0, v1, v2, v3, v4, v5 } = this.savePolicyLine(ptype, rule);

      await CasbinRule.deleteMany({ p_type, v0, v1, v2, v3, v4, v5 }, options);

      this.autoCommit && options.session && await options.session.commitTransaction();
    } catch (err) {
      this.autoAbort && options.session && await options.session.abortTransaction();
      throw err;
    }
  }

  /**
   * Implements the process of removing a policyList rules.
   * This method is used by casbin and should not be called by user.
   *
   * @param {String} sec Section of the policy
   * @param {String} ptype Type of the policy (e.g. "p" or "g")
   * @param {Array<String>} rules Policy rule to remove from enforcer
   * @returns {Promise<void>}
   */
  async removePolicies (sec, ptype, rules) {
    const options = {};
    try {
      if (this.isSynced) options.session = await this.getTransaction();
      else throw new InvalidAdapterTypeError('removePolicies is only supported by SyncedAdapter. See newSyncedAdapter');

      const promises = rules.map(async rule => this.removePolicy(sec, ptype, rule));
      await Promise.all(promises);

      this.autoCommit && options.session && await options.session.commitTransaction();
    } catch (err) {
      this.autoAbort && options.session && await options.session.abortTransaction();
      throw err;
    }
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
    const options = {};
    try {
      if (this.isSynced) options.session = await this.getTransaction();
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
      await CasbinRule.deleteMany(where, options);

      this.autoCommit && options.session && await options.session.commitTransaction();
    } catch (err) {
      this.autoAbort && options.session && await options.session.abortTransaction();
      throw err;
    }
  }

  async close () {
    if (this.mongoseInstance && this.mongoseInstance.connection) {
      if (this.session) await this.session.endSession();
      await this.mongoseInstance.connection.close();
    }
  }
}

module.exports = MongooseAdapter;
