import test from 'ava';
import { WebSolana, WebUSDCSolana } from '../src';

test('exports tokens', async (t) => {
  t.is(typeof WebSolana, 'function');
  t.is(typeof WebUSDCSolana, 'function');
});
