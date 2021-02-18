<a name="MongooseAdapter"></a>

## MongooseAdapter
Implements a policy adapter for casbin with MongoDB support.

**Kind**: global class  

* [MongooseAdapter](#MongooseAdapter)
    * [new MongooseAdapter(uri, [options])](#new_MongooseAdapter_new)
    * _instance_
        * [._open()](#MongooseAdapter+_open) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.setFiltered([enable])](#MongooseAdapter+setFiltered)
        * [.isFiltered()](#MongooseAdapter+isFiltered) ⇒ <code>boolean</code>
        * [.setSynced([synced])](#MongooseAdapter+setSynced)
        * [.setAutoAbort([abort])](#MongooseAdapter+setAutoAbort)
        * [.setAutoCommit([commit])](#MongooseAdapter+setAutoCommit)
        * [.getSession()](#MongooseAdapter+getSession) ⇒ <code>Promise.&lt;Session&gt;</code>
        * [.setSession()](#MongooseAdapter+setSession)
        * [.getTransaction()](#MongooseAdapter+getTransaction) ⇒ <code>Promise.&lt;Session&gt;</code>
        * [.commitTransaction()](#MongooseAdapter+commitTransaction) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.abortTransaction()](#MongooseAdapter+abortTransaction) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.loadPolicyLine(line, model)](#MongooseAdapter+loadPolicyLine)
        * [.loadPolicy(model)](#MongooseAdapter+loadPolicy) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.loadFilteredPolicy(model, [filter])](#MongooseAdapter+loadFilteredPolicy)
        * [.savePolicyLine(ptype, rule)](#MongooseAdapter+savePolicyLine) ⇒ <code>Object</code>
        * [.savePolicy(model)](#MongooseAdapter+savePolicy) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.addPolicy(sec, ptype, rule)](#MongooseAdapter+addPolicy) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.addPolicies(sec, ptype, rule)](#MongooseAdapter+addPolicies) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.removePolicy(sec, ptype, rule)](#MongooseAdapter+removePolicy) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.removePolicies(sec, ptype, rules)](#MongooseAdapter+removePolicies) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues)](#MongooseAdapter+removeFilteredPolicy) ⇒ <code>Promise.&lt;void&gt;</code>
    * _static_
        * [.newAdapter(uri, [options], [adapterOptions])](#MongooseAdapter.newAdapter)
        * [.newFilteredAdapter(uri, [options])](#MongooseAdapter.newFilteredAdapter)
        * [.newSyncedAdapter(uri, [options], autoAbort)](#MongooseAdapter.newSyncedAdapter)

<a name="new_MongooseAdapter_new"></a>

### new MongooseAdapter(uri, [options])
Creates a new instance of mongoose adapter for casbin.
It does not wait for successfull connection to MongoDB.
So, if you want to have a possibility to wait until connection successful, use newAdapter instead.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>String</code> |  | Mongo URI where casbin rules must be persisted |
| [options] | <code>Object</code> | <code>{}</code> | Additional options to pass on to mongoose client |

**Example**  
```js
const adapter = new MongooseAdapter('MONGO_URI');
const adapter = new MongooseAdapter('MONGO_URI', { mongoose_options: 'here' })
```
<a name="MongooseAdapter+_open"></a>

### mongooseAdapter.\_open() ⇒ <code>Promise.&lt;void&gt;</code>
Opens a connection to mongoDB

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
<a name="MongooseAdapter+setFiltered"></a>

### mongooseAdapter.setFiltered([enable])
Switch adapter to (non)filtered state.
Casbin uses this flag to determine if it should load the whole policy from DB or not.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [enable] | <code>Boolean</code> | <code>true</code> | Flag that represents the current state of adapter (filtered or not) |

<a name="MongooseAdapter+isFiltered"></a>

### mongooseAdapter.isFiltered() ⇒ <code>boolean</code>
isFiltered determines whether the filtered model is enabled for the adapter.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
<a name="MongooseAdapter+setSynced"></a>

### mongooseAdapter.setSynced([synced])
SyncedAdapter: Switch adapter to (non)synced state.
This enables mongoDB transactions when loading and saving policies to DB.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [synced] | <code>Boolean</code> | <code>true</code> | Flag that represents the current state of adapter (filtered or not) |

<a name="MongooseAdapter+setAutoAbort"></a>

### mongooseAdapter.setAutoAbort([abort])
SyncedAdapter: Automatically abort on Error.
When enabled, functions will automatically abort on error

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [abort] | <code>Boolean</code> | <code>true</code> | Flag that represents if automatic abort should be enabled or not |

<a name="MongooseAdapter+setAutoCommit"></a>

### mongooseAdapter.setAutoCommit([commit])
SyncedAdapter: Automatically commit after each addition.
When enabled, functions will automatically commit after function has finished

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [commit] | <code>Boolean</code> | <code>true</code> | Flag that represents if automatic commit should be enabled or not |

<a name="MongooseAdapter+getSession"></a>

### mongooseAdapter.getSession() ⇒ <code>Promise.&lt;Session&gt;</code>
SyncedAdapter: Gets active session or starts a new one. Sessions are used to handle transactions.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
<a name="MongooseAdapter+setSession"></a>

### mongooseAdapter.setSession()
SyncedAdapter: Sets current session to specific one. Do not use this unless you know what you are doing.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
<a name="MongooseAdapter+getTransaction"></a>

### mongooseAdapter.getTransaction() ⇒ <code>Promise.&lt;Session&gt;</code>
SyncedAdapter: Gets active transaction or starts a new one. Transaction must be closed before changes are done
to the database. See: commitTransaction, abortTransaction

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
**Returns**: <code>Promise.&lt;Session&gt;</code> - Returns a session with active transaction  
<a name="MongooseAdapter+commitTransaction"></a>

### mongooseAdapter.commitTransaction() ⇒ <code>Promise.&lt;void&gt;</code>
SyncedAdapter: Commits active transaction. Documents are not saved before this function is used.
Transaction closes after the use of this function.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
<a name="MongooseAdapter+abortTransaction"></a>

### mongooseAdapter.abortTransaction() ⇒ <code>Promise.&lt;void&gt;</code>
SyncedAdapter: Aborts active transaction. All Document changes within this transaction are reverted.
Transaction closes after the use of this function.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
<a name="MongooseAdapter+loadPolicyLine"></a>

### mongooseAdapter.loadPolicyLine(line, model)
Loads one policy rule into casbin model.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| line | <code>Object</code> | Record with one policy rule from MongoDB |
| model | <code>Object</code> | Casbin model to which policy rule must be loaded |

<a name="MongooseAdapter+loadPolicy"></a>

### mongooseAdapter.loadPolicy(model) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of loading policy from database into enforcer.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Model</code> | Model instance from enforcer |

<a name="MongooseAdapter+loadFilteredPolicy"></a>

### mongooseAdapter.loadFilteredPolicy(model, [filter])
Loads partial policy based on filter criteria.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Model</code> | Enforcer model |
| [filter] | <code>Object</code> | MongoDB filter to query |

<a name="MongooseAdapter+savePolicyLine"></a>

### mongooseAdapter.savePolicyLine(ptype, rule) ⇒ <code>Object</code>
Generates one policy rule ready to be saved into MongoDB.
This method is used by casbin to generate Mongoose Model Object for single policy
and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
**Returns**: <code>Object</code> - Returns a created CasbinRule record for MongoDB  

| Param | Type | Description |
| --- | --- | --- |
| ptype | <code>String</code> | Policy type to save into MongoDB |
| rule | <code>Array.&lt;String&gt;</code> | An array which consists of policy rule elements to store |

<a name="MongooseAdapter+savePolicy"></a>

### mongooseAdapter.savePolicy(model) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Implements the process of saving policy from enforcer into database.
If you are using replica sets with mongo, this function will use mongo
transaction, so every line in the policy needs tosucceed for this to
take effect.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Model</code> | Model instance from enforcer |

<a name="MongooseAdapter+addPolicy"></a>

### mongooseAdapter.addPolicy(sec, ptype, rule) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of adding policy rule.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| sec | <code>String</code> | Section of the policy |
| ptype | <code>String</code> | Type of the policy (e.g. "p" or "g") |
| rule | <code>Array.&lt;String&gt;</code> | Policy rule to add into enforcer |

<a name="MongooseAdapter+addPolicies"></a>

### mongooseAdapter.addPolicies(sec, ptype, rule) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of adding a list of policy rules.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| sec | <code>String</code> | Section of the policy |
| ptype | <code>String</code> | Type of the policy (e.g. "p" or "g") |
| rule | <code>Array.&lt;String&gt;</code> | Policy rule to add into enforcer |

<a name="MongooseAdapter+removePolicy"></a>

### mongooseAdapter.removePolicy(sec, ptype, rule) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of removing a list of policy rules.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| sec | <code>String</code> | Section of the policy |
| ptype | <code>String</code> | Type of the policy (e.g. "p" or "g") |
| rule | <code>Array.&lt;String&gt;</code> | Policy rule to remove from enforcer |

<a name="MongooseAdapter+removePolicies"></a>

### mongooseAdapter.removePolicies(sec, ptype, rules) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of removing a policyList rules.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| sec | <code>String</code> | Section of the policy |
| ptype | <code>String</code> | Type of the policy (e.g. "p" or "g") |
| rules | <code>Array.&lt;String&gt;</code> | Policy rule to remove from enforcer |

<a name="MongooseAdapter+removeFilteredPolicy"></a>

### mongooseAdapter.removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of removing policy rules.
This method is used by casbin and should not be called by user.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| sec | <code>String</code> | Section of the policy |
| ptype | <code>String</code> | Type of the policy (e.g. "p" or "g") |
| fieldIndex | <code>Number</code> | Index of the field to start filtering from |
| ...fieldValues | <code>String</code> | Policy rule to match when removing (starting from fieldIndex) |

<a name="MongooseAdapter.newAdapter"></a>

### MongooseAdapter.newAdapter(uri, [options], [adapterOptions])
Creates a new instance of mongoose adapter for casbin.
Instead of constructor, it does wait for successfull connection to MongoDB.
Preferable way to construct an adapter instance, is to use this static method.

**Kind**: static method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>String</code> |  | Mongo URI where casbin rules must be persisted |
| [options] | <code>Object</code> | <code>{}</code> | Additional options to pass on to mongoose client |
| [adapterOptions] | <code>Object</code> | <code>{}</code> | Additional options to pass on to adapter |

**Example**  
```js
const adapter = await MongooseAdapter.newAdapter('MONGO_URI');
const adapter = await MongooseAdapter.newAdapter('MONGO_URI', { mongoose_options: 'here' });
```
<a name="MongooseAdapter.newFilteredAdapter"></a>

### MongooseAdapter.newFilteredAdapter(uri, [options])
Creates a new instance of mongoose adapter for casbin.
It does the same as newAdapter, but it also sets a flag that this adapter is in filtered state.
That way, casbin will not call loadPolicy() automatically.

**Kind**: static method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>String</code> |  | Mongo URI where casbin rules must be persisted |
| [options] | <code>Object</code> | <code>{}</code> | Additional options to pass on to mongoose client |

**Example**  
```js
const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI');
const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI', { mongoose_options: 'here' });
```
<a name="MongooseAdapter.newSyncedAdapter"></a>

### MongooseAdapter.newSyncedAdapter(uri, [options], autoAbort)
Creates a new instance of mongoose adapter for casbin.
It does the same as newAdapter, but it checks wether database is a replica set. If it is, it enables
transactions for the adapter.
Transactions are never commited automatically. You have to use commitTransaction to add pending changes.

**Kind**: static method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>String</code> |  | Mongo URI where casbin rules must be persisted |
| [options] | <code>Object</code> | <code>{}</code> | Additional options to pass on to mongoose client |
| autoAbort | <code>Boolean</code> | <code>true</code> | Whether to abort transactions on Error automatically |

**Example**  
```js
const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI');
const adapter = await MongooseAdapter.newFilteredAdapter('MONGO_URI', { mongoose_options: 'here' });
```
