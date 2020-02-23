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

const { Schema } = require('mongoose')
const mongoose = require('mongoose')

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
}, { collection: 'casbin_rule', minimize: false, timestamps: false })

module.exports = mongoose.model('CasbinRule', schema, 'casbin_rule')
