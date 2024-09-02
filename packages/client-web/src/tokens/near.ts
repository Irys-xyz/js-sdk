import type { Signer } from "arbundles";
import { NearSigner } from "arbundles/web";
import BigNumber from "bignumber.js";
import type { TokenConfig, Tx } from "@irys-network/core-bundler-client/types";
import { KeyPair } from "@near-js/crypto";
import { BrowserLocalStorageKeyStore } from "@near-js/keystores-browser";
import { SCHEMA, Signature, SignedTransaction, actionCreators, createTransaction } from "@near-js/transactions";
import bs58 from "bs58";
import { serialize } from "borsh";
import BN from "bn.js";
import { sha256 } from "js-sha256";
import BaseWebToken from "./base";
import type { Provider } from "@near-js/providers";
import type { WalletConnection, Near } from "@near-js/wallet-account";
export default class NearConfig extends BaseWebToken {
  // protected keyStore: KeyPair
  protected keyPair!: KeyPair;
  protected declare wallet: WalletConnection;
  protected near: Near;
  protected declare providerInstance: Provider;

  constructor(config: TokenConfig) {
    super(config);
    this.near = this.wallet._near;
    this.base = ["yoctoNEAR", 1e25];
    // this.keyPair = KeyPair.fromString(this.wallet)
  }

  async ready(): Promise<void> {
    if (!this.wallet.isSignedIn()) {
      throw new Error("Wallet has not been signed in!");
    }
    const keystore = new BrowserLocalStorageKeyStore();
    const account = this.wallet.account();
    // console.log(this.address)
    // console.log(await account.getAccessKeys())
    // this._address = this.wallet.getAccountId()
    // this.keyPair = KeyPair.fromString(this.wallet)
    // console.log(await account.getAccessKeys())
    this.keyPair = await keystore.getKey(this.wallet._networkId, account.accountId);
    if (!this.keyPair) {
      this.keyPair = KeyPair.fromRandom("ed25519");
      const publicKey = this.keyPair.getPublicKey().toString();
      // this.wallet._networkId
      await keystore.setKey(this.wallet._networkId, account.accountId, this.keyPair);
      // can't do this :c
      // console.log(publicKey)
      await account.addKey(publicKey);
    }
    // console.log(this.keyPair.getPublicKey().toString());
    // this._address = this.ownerToAddress(Buffer.from(this.keyPair.getPublicKey().data));
    this._address = await this.wallet.getAccountId();
    // this.providerInstance = new providers.JsonRpcProvider({ url: this.providerUrl });
    this.providerInstance = this.wallet._near.connection.provider;
    // console.log(this.keyPair);
  }

  /**
   * NEAR wants both the sender ID and tx Hash, so we have to concatenate to keep with the interface.
   * @param txId assumes format senderID:txHash
   */
  async getTx(txId: string): Promise<Tx> {
    // NOTE: their type defs are out of date with their actual API (23-01-2022)... beware the expect-error when debugging!
    const provider = await this.providerInstance;
    const [id, hash] = txId.split(":");
    const status = await provider.txStatusReceipts(bs58.decode(hash), id);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error

    const blockHeight = await provider.block(status.transaction_outcome.block_hash);
    const latestBlockHeight = (await provider.block({ finality: "final" })).header.height;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (status.receipts_outcome[0].outcome.status.SuccessValue !== "") {
      throw new Error("Transaction failed!");
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const deposit = status.receipts[0].receipt.Action.actions[0].Transfer.deposit ?? 0;

    // console.log(decode(status.receipts_outcome[0].block_hash))

    // // const routcometx = await provider.txStatusReceipts(decode(status.receipts_outcome[0].block_hash), status.receipts_outcome[0].id)
    // console.log({ blockHeight, status, latestBlockHeight })
    return {
      from: id,
      to: status.transaction.receiver_id,
      amount: new BigNumber(deposit),
      blockHeight: new BigNumber(blockHeight.header.height),
      pending: false,
      confirmed: latestBlockHeight - blockHeight.header.height >= this.minConfirm,
    };
  }

  /**
   * address = accountID
   * @param owner // assumed to be the "ed25519:" header + b58 encoded key
   */
  ownerToAddress(owner: any): string {
    // should just return the loaded address?
    const pubkey = typeof owner === "string" ? owner : bs58.encode(owner);
    return Buffer.from(bs58.decode(pubkey.replace("ed25519:", ""))).toString("hex");
  }

  async sign(data: Uint8Array): Promise<Uint8Array> {
    return this.getSigner().sign(data);
  }

  getSigner(): Signer {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return new NearSigner(this.keyPair.secretKey);
  }

  async verify(pub: any, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    return NearSigner.verify(pub, data, signature);
  }

  async getCurrentHeight(): Promise<BigNumber> {
    // const provider = await this.getProvider();
    const res = await this.providerInstance.status();
    return new BigNumber(res.sync_info.latest_block_height);
  }

  async getFee(_amount: BigNumber.Value, _to?: string): Promise<BigNumber> {
    // const provider = await this.getProvider();
    // one unit of gas
    // const res = await provider.connection.provider.gasPrice(await (await this.getCurrentHeight()).toNumber())

    const latestBlockHeight = (await this.providerInstance.block({ finality: "final" })).header.height;
    const res = await this.providerInstance.gasPrice(latestBlockHeight); // null == gas price as of latest block
    // multiply by action cost in gas units (assume only action is transfer)
    // 4.5x10^11 gas units for fund transfers
    return new BigNumber(res.gas_price).multipliedBy(450_000_000_000);
  }

  async sendTx(data: any): Promise<any> {
    data as SignedTransaction;
    const res = await this.providerInstance.sendTransaction(data);
    return `${this.address}:${res.transaction.hash}`; // encode into compound format
  }

  async createTx(amount: BigNumber.Value, to: string, _fee?: string): Promise<{ txId: string | undefined; tx: any }> {
    if (!this.address) throw new Error("Address is undefined - you might be missing a wallet, or have not run Irys.ready()");
    const accessKey = await this.providerInstance.query({
      request_type: "view_access_key",
      finality: "final",
      account_id: this.address,
      public_key: this.keyPair.getPublicKey().toString(),
    });
    // console.log(accessKey);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const nonce = ++accessKey.nonce;
    const recentBlockHash = Buffer.from(bs58.decode(accessKey.block_hash));
    const actions = [actionCreators.transfer(new BN(new BigNumber(amount).toString()))];
    const tx = createTransaction(this.address, this.keyPair.getPublicKey(), to, nonce, actions, recentBlockHash);
    const serialTx = serialize(SCHEMA, tx);
    const serialTxHash = new Uint8Array(sha256.array(serialTx));
    const signature = this.keyPair.sign(serialTxHash);
    const signedTx = new SignedTransaction({
      transaction: tx,
      signature: new Signature({
        keyType: tx.publicKey.keyType,
        data: signature.signature,
      }),
    });
    return { tx: signedTx, txId: undefined };
  }

  async getPublicKey(): Promise<string | Buffer> {
    return Buffer.from(this.keyPair.getPublicKey().data);
  }
}
