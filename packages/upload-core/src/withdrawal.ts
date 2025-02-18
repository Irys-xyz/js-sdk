import Utils from './utils';
import BigNumber from 'bignumber.js';
import type Api from './api';
import base64url from 'base64url';
import type { WithdrawalResponse } from './types';

/**
 * Create and send a withdrawal request
 * @param utils Instance of Utils
 * @param api Instance of API
 * @param wallet Wallet to use
 * @param amount amount to withdraw in winston
 * @returns the response from the bundler
 */
export async function withdrawBalance(
  utils: Utils,
  api: Api,
  amount: BigNumber.Value | 'all'
): Promise<WithdrawalResponse> {
  const c = utils.tokenConfig;
  const { deepHash, stringToBuffer } = c.irys.bundles;
  const pkey = await c.getPublicKey();
  const withdrawAll = amount === 'all';
  const data = {
    publicKey: pkey,
    currency: utils.token,
    amount: withdrawAll ? 'all' : new BigNumber(amount).toString(),
    nonce: await utils.getNonce(),
    signature: '',
    sigType: c.getSigner().signatureType,
  };
  const deephash = await deepHash([
    stringToBuffer(data.currency),
    stringToBuffer(data.amount.toString()),
    stringToBuffer(data.nonce.toString()),
  ]);
  if (!Buffer.isBuffer(data.publicKey)) {
    data.publicKey = Buffer.from(data.publicKey);
  }

  const signature = await c.sign(deephash);
  const isValid = await c.verify(data.publicKey, deephash, signature);

  data.publicKey = base64url.encode(data.publicKey);
  data.signature = base64url.encode(Buffer.from(signature));

  const cpk = base64url.toBuffer(data.publicKey);
  const csig = base64url.toBuffer(data.signature);

  // should match opk and csig
  const dh2 = await deepHash([
    stringToBuffer(data.currency),
    stringToBuffer(data.amount.toString()),
    stringToBuffer(data.nonce.toString()),
  ]);

  const isValid2 = await c.verify(cpk, dh2, csig);
  const isValid3 =
    (await c.ownerToAddress(
      c.name == 'arweave'
        ? base64url.decode(data.publicKey)
        : base64url.toBuffer(data.publicKey)
    )) === c.address;

  if (!(isValid || isValid2 || isValid3)) {
    throw new Error(
      `Internal withdrawal validation failed - please report this!\nDebug Info:${JSON.stringify(data)}`
    );
  }

  const res = await api.post('/account/withdraw', data);

  if (res.status === 202) {
    // node has timed/erroed out confirming the withdrawal
    const txId = res.data.tx_id;
    const withdrawalConfirmed = await utils.confirmationPoll(txId);
    if (!(withdrawalConfirmed === true))
      throw new Error(
        `Unable to confirm withdrawal tx ${txId} ${withdrawalConfirmed ? withdrawalConfirmed?.toString() : ''}`
      );
  } else {
    Utils.checkAndThrow(res, 'Withdrawing balance');
  }
  return res.data;
}
