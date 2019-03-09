/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';


const React = require('./src/React');

// NOTE: 不同学习章节中自己添加的代码，使用后最好注释掉，以免影响别的章节
// demo1：react源码构建测试
// debugger;
// console.log(React);
// console.log('react config success...')

// TODO: decide on the top-level export form.
// This is hacky but makes it work with both Rollup and Jest.
module.exports = React.default || React;
