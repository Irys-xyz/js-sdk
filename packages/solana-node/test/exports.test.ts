import test from 'ava';
import { Solana, USDCSolana } from '../src';

test('exports tokens', async (t) => {
  t.is(typeof Solana, 'function');
  t.is(typeof USDCSolana, 'function');
});
