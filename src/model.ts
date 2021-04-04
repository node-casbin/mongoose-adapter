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

import {Schema, Document, model} from 'mongoose';

export interface IModel extends Document {
  p_type: string;
  v0: string;
  v1: string;
  v2: string;
  v3: string;
  v4: string;
  v5: string;
}

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
}, {
  collection: 'casbin_rule',
  minimize: false,
  timestamps: false
});

export default model<IModel>('CasbinRule', schema, 'casbin_rule');
