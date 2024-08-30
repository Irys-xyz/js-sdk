/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import test from 'ava';
import * as exported from '../../dist/esm/index.js';

test('it successfully exports esm named exports', (t) => {
  const exportedKeys = Object.keys(exported);

  t.true(exportedKeys.includes('sleep'));
});

