/* eslint-disable import/no-extraneous-dependencies */
const test = require('ava');

const exported = require('../../dist/cjs/index.js');

test('it successfully exports commonjs named exports', (t) => {
  const exportedKeys = Object.keys(exported);

  t.true(exportedKeys.includes('sleep'));
});
