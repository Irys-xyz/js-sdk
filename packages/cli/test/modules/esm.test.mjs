/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import test from 'ava';
import * as exported from '../../dist/esm/token.js';

test('it successfully exports esm exports', (t) => {
  const exportedKeys = Object.keys(exported);
  t.true(exportedKeys.length > 0);
});

