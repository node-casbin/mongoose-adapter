<a name="MongooseAdapter"></a>

## MongooseAdapter
Implements a policy adapter for casbin with MongoDB support.

**Kind**: global class  

* [MongooseAdapter](#MongooseAdapter)
    * [new MongooseAdapter(uri, [options])](#new_MongooseAdapter_new)
    * _instance_
        * [.isFiltered](#MongooseAdapter+isFiltered) ⇒ <code>Boolean</code>
        * [.loadPolicyLine(line, model)](#MongooseAdapter+loadPolicyLine) ⇒ <code>void</code>
        * [.loadPolicy(model)](#MongooseAdapter+loadPolicy) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.loadFilteredPolicy(model, filter)](#MongooseAdapter+loadFilteredPolicy)
        * [.savePolicyLine(ptype, rule)](#MongooseAdapter+savePolicyLine) ⇒ <code>Object</code>
        * [.savePolicy(model)](#MongooseAdapter+savePolicy) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.addPolicy(sec, ptype, rule)](#MongooseAdapter+addPolicy) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.removePolicy(sec, ptype, rule)](#MongooseAdapter+removePolicy) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues)](#MongooseAdapter+removeFilteredPolicy) ⇒ <code>Promise.&lt;void&gt;</code>
    * _static_
        * [.newAdapter(uri, [options])](#MongooseAdapter.newAdapter)

<a name="new_MongooseAdapter_new"></a>

### new MongooseAdapter(uri, [options])
Creates a new instance of mongoose adapter for casbin.
It does not wait for successfull connection to MongoDB.
So, if you want to have a possibility to wait until connection successful, use newAdapter.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>String</code> |  | Mongo URI where casbin rules must be persisted |
| [options] | <code>Object</code> | <code>{}</code> | Additional options to pass on to mongoose client |

<a name="MongooseAdapter+isFiltered"></a>

### mongooseAdapter.isFiltered ⇒ <code>Boolean</code>
Check if adapter is in filtered state.

**Kind**: instance property of [<code>MongooseAdapter</code>](#MongooseAdapter)  
<a name="MongooseAdapter+loadPolicyLine"></a>

### mongooseAdapter.loadPolicyLine(line, model) ⇒ <code>void</code>
Loads one policy rule into casbin model.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| line | <code>Object</code> | Record with one policy rule from MongoDB |
| model | <code>Object</code> | Casbin model to which policy rule must be loaded |

<a name="MongooseAdapter+loadPolicy"></a>

### mongooseAdapter.loadPolicy(model) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of loading policy from database into enforcer.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Model</code> | Model instance from enforcer |

<a name="MongooseAdapter+loadFilteredPolicy"></a>

### mongooseAdapter.loadFilteredPolicy(model, filter)
Loads partial policy based on filter criteria.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Model</code> | Enforcer model |
| filter | <code>Object</code> | MongoDB filter to query |

<a name="MongooseAdapter+savePolicyLine"></a>

### mongooseAdapter.savePolicyLine(ptype, rule) ⇒ <code>Object</code>
Persists one policy rule into MongoDB.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  
**Returns**: <code>Object</code> - Returns a created CasbinRule record for MongoDB  

| Param | Type | Description |
| --- | --- | --- |
| ptype | <code>String</code> | Policy type to save into MongoDB |
| rule | <code>Array.&lt;String&gt;</code> | An array which consists of policy rule elements to store |

<a name="MongooseAdapter+savePolicy"></a>

### mongooseAdapter.savePolicy(model) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Implements the process of saving policy from enforcer into database.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>Model</code> | Model instance from enforcer |

<a name="MongooseAdapter+addPolicy"></a>

### mongooseAdapter.addPolicy(sec, ptype, rule) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of adding policy rule.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| sec | <code>String</code> | Section of the policy |
| ptype | <code>String</code> | Type of the policy (e.g. "p" or "g") |
| rule | <code>Array.&lt;String&gt;</code> | Policy rule to add into enforcer |

<a name="MongooseAdapter+removePolicy"></a>

### mongooseAdapter.removePolicy(sec, ptype, rule) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of removing policy rule.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| sec | <code>String</code> | Section of the policy |
| ptype | <code>String</code> | Type of the policy (e.g. "p" or "g") |
| rule | <code>Array.&lt;String&gt;</code> | Policy rule to remove from enforcer |

<a name="MongooseAdapter+removeFilteredPolicy"></a>

### mongooseAdapter.removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues) ⇒ <code>Promise.&lt;void&gt;</code>
Implements the process of removing policy rules.

**Kind**: instance method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Description |
| --- | --- | --- |
| sec | <code>String</code> | Section of the policy |
| ptype | <code>String</code> | Type of the policy (e.g. "p" or "g") |
| fieldIndex | <code>Number</code> | Index of the field to start filtering from |
| ...fieldValues | <code>String</code> | Policy rule to match when removing (starting from fieldIndex) |

<a name="MongooseAdapter.newAdapter"></a>

### MongooseAdapter.newAdapter(uri, [options])
Creates a new instance of mongoose adapter for casbin.
Instead of constructor, it does wait for successfull connection to MongoDB.
Preferable way to construct an adapter instance, is to use this static method.

**Kind**: static method of [<code>MongooseAdapter</code>](#MongooseAdapter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| uri | <code>String</code> |  | Mongo URI where casbin rules must be persisted |
| [options] | <code>Object</code> | <code>{}</code> | Additional options to pass on to mongoose client |

**Example**  
```js
const adapter = await MongooseAdapter.newAdapter('MONGO_URI');
const adapter = await MongooseAdapter.newAdapter('MONGO_URI', { mongoose_options: 'here' });
```
