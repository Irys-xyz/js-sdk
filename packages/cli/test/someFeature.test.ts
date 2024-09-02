import test from 'ava';
import { getToken } from '../src/token';

test('example test', async (t) => {
  t.is(typeof getToken, 'function');
});
