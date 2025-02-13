/* eslint-disable import/no-extraneous-dependencies */
const test = require('ava');

const exported = require('../../dist/cjs/token.js');

test('it successfully exports commonjs exports', (t) => {
  const exportedKeys = Object.keys(exported);
  t.true(exportedKeys.length > 0);
});
