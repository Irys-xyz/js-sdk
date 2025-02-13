import type { DataItemCreateOptions, Signer } from '@irys/bundles';
import type BigNumber from 'bignumber.js';
import type { Readable } from 'stream';
import type Api from './api';
import type Fund from './fund';
import buildIrysTransaction from './transaction';
import type { Transaction } from './transactions';
import type {
  bundles,
  CreateAndUploadOptions,
  Token,
  FundResponse,
  IrysTransaction,
  IrysTransactionCreateOptions,
  IrysTransactonCtor,
  UploadReceipt,
  UploadReceiptData,
  UploadResponse,
  WithdrawalResponse,
  Network,
  Tags,
} from './types';
import type Uploader from './upload';
import Utils from './utils';
import { withdrawBalance } from './withdrawal';
import Query from '@irys/query';
import type { Approval } from './approval';

export abstract class Irys {
  public api!: Api;
  public utils!: Utils;
  public uploader!: Uploader;
  public funder!: Fund;
  public _address: string | undefined;
  public token!: string;
  public tokenConfig!: Token;
  public transactions!: Transaction;
  public approval!: Approval;
  protected _readyPromise: Promise<void> | undefined;
  public url: URL;
  public bundles: bundles;
  public IrysTransaction: IrysTransactonCtor;
  static VERSION = 'REPLACEMEIRYSVERSION';
  public debug = false;

  constructor({ url, bundles }: { url?: string | Network; bundles: bundles }) {
    switch (url) {
      case 'mainnet':
        url = 'https://uploader.irys.xyz';
        break;
      case 'devnet':
        url = 'https://devnet.irys.xyz';
        break;
    }
    if (!url)
      throw new Error(
        `Missing required Irys constructor parameter: URL or valid Network`
      );
    const parsed = new URL(url);
    // if(parsed.host.startsWith("node1") || parsed.host.includes("arweave")) throw new Error("")

    this.url = parsed;
    this.bundles = bundles;
    this.IrysTransaction = buildIrysTransaction(this);
  }

  get address(): string {
    if (!this._address)
      throw new Error(
        'Address is undefined, please provide a wallet or run `await irys.ready()`'
      );
    return this._address;
  }

  set address(address: string) {
    this._address = address;
  }

  get signer(): Signer {
    return this.tokenConfig.getSigner();
  }

  async withdrawBalance(
    amount: BigNumber.Value | 'all'
  ): Promise<WithdrawalResponse> {
    return withdrawBalance(this.utils, this.api, amount);
  }

  async withdrawAll(): Promise<WithdrawalResponse> {
    return withdrawBalance(this.utils, this.api, 'all');
  }

  /**
   * @deprecated Use getBalance with no address instead.
   *
   * Gets the balance for the loaded wallet
   * @returns balance (in winston)
   */
  async getLoadedBalance(): Promise<BigNumber> {
    if (!this.address) throw new Error('address is undefined');
    return this.utils.getBalance(this.address);
  }

  /**
   * Gets the balance for the specified address
   * @param address address to query for
   * @returns the balance (in winston)
   */
  async getBalance(address?: string): Promise<BigNumber> {
    if (address) return this.utils.getBalance(address);
    if (!this.address) throw new Error('address is undefined');
    return this.utils.getBalance(this.address);
  }

  /**
   * Sends amount atomic units to the specified bundler
   * @param amount amount to send in atomic units
   * @returns details about the fund transaction
   */
  async fund(
    amount: BigNumber.Value,
    multiplier?: number
  ): Promise<FundResponse> {
    return this.funder.fund(amount, multiplier);
  }

  /**
   * Calculates the price for [bytes] bytes for the loaded token and Irys node.
   * @param bytes
   * @returns
   */
  public async getPrice(
    bytes: number,
    opts?: { tags?: Tags; address?: string }
  ): Promise<BigNumber> {
    return this.utils.getPrice(this.token, bytes, opts);
  }

  public async verifyReceipt(receipt: UploadReceiptData): Promise<boolean> {
    return Utils.verifyReceipt(this.bundles, receipt);
  }

  /**
   * Create a new IrysTransactions (flex token bundles dataItem)
   * @param data
   * @param opts - dataItemCreateOptions
   * @returns - a new IrysTransaction instance
   */
  createTransaction(
    data: string | Buffer,
    opts?: IrysTransactionCreateOptions
  ): IrysTransaction {
    return new this.IrysTransaction(data, this, opts);
  }

  /**
   * Returns the signer for the loaded token
   */
  getSigner(): Signer {
    return this.tokenConfig.getSigner();
  }

  async upload(
    data: string | Buffer | Readable,
    opts?: CreateAndUploadOptions
  ): Promise<UploadResponse> {
    return this.uploader.uploadData(data, opts);
  }

  /**
   * @deprecated - use upload instead
   */
  async uploadWithReceipt(
    data: string | Buffer | Readable,
    opts?: DataItemCreateOptions
  ): Promise<UploadReceipt> {
    return this.uploader.uploadData(data, {
      ...opts,
    }) as Promise<UploadReceipt>;
  }

  async ready(): Promise<this> {
    this.tokenConfig.ready ? await this.tokenConfig.ready() : true;
    this.address = this.tokenConfig.address!;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  get transaction() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const oThis = this;
    return {
      fromRaw(rawTransaction: Uint8Array): IrysTransaction {
        return new oThis.IrysTransaction(rawTransaction, oThis, {
          dataIsRawTransaction: true,
        });
      },
    };
  }

  get search(): InstanceType<typeof Query>['search'] {
    const q = new Query({ url: new URL('/graphql', this.url) });
    return q.search.bind(q);
  }

  public query(queryOpts?: ConstructorParameters<typeof Query>[0]): Query {
    return new Query(queryOpts ?? { url: new URL('graphql', this.url) });
  }
}

export default Irys;
