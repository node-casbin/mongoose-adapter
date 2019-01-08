const { Schema } = require('mongoose');
const mongoose = require('mongoose');

const schema = new Schema({
  p_type: {
    type: Schema.Types.String,
    required: true,
    index: true
  },
  v0: {
    type: Schema.Types.String,
    index: true
  },
  v1: {
    type: Schema.Types.String,
    index: true
  },
  v2: {
    type: Schema.Types.String,
    index: true
  },
  v3: {
    type: Schema.Types.String,
    index: true
  },
  v4: {
    type: Schema.Types.String,
    index: true
  },
  v5: {
    type: Schema.Types.String,
    index: true
  }
}, { collection: 'casbin_rule', minimize: false, timestamps: false });

module.exports = mongoose.model('CasbinRule', schema, 'casbin_rule');
