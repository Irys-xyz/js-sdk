import test from 'ava';
import { Starknet } from '../src/client';

test('example test', async (t) => {
  t.is(typeof Starknet, 'function');
});
