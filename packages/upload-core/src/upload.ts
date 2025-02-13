/* eslint-disable no-case-declarations */
import {
  PromisePool,
  type Stoppable,
  type UsesConcurrency,
} from '@supercharge/promise-pool';
import type { DataItem, JWKInterface } from '@irys/bundles/node';
import { ArweaveSigner } from '@irys/bundles';
import type { AxiosResponse } from 'axios';
import base64url from 'base64url';
import type { Readable } from 'stream';
import type Api from './api';
import { ChunkingUploader } from './chunkingUploader';
import {
  type Token,
  type bundles,
  type IrysTransactonCtor,
  type UploadOptions,
  type UploadReceipt,
  type UploadResponse,
  type CreateAndUploadOptions,
  type Manifest,
  type IrysTransaction,
  type DataItemCreateOptions,
  UploadHeaders,
} from './types';
import type Utils from './utils';
import { randomBytes } from 'crypto';
import retry from 'async-retry';
import { httpErrData } from './utils';

export const CHUNKING_THRESHOLD = 50_000_000;
// eslint-disable-next-line @typescript-eslint/naming-convention
export class Uploader {
  protected readonly api: Api;
  protected token: string;
  protected tokenConfig: Token;
  protected utils: Utils;
  protected contentTypeOverride: string | undefined;
  protected forceUseChunking: boolean | undefined;
  protected bundles: bundles;
  protected irysTransaction: IrysTransactonCtor;

  constructor(
    api: Api,
    utils: Utils,
    token: string,
    tokenConfig: Token,
    irysTransaction: IrysTransactonCtor
  ) {
    this.api = api;
    this.token = token;
    this.tokenConfig = tokenConfig;
    this.bundles = this.tokenConfig.irys.bundles;
    this.utils = utils;
    this.irysTransaction = irysTransaction;
  }

  /**
   * Uploads a given transaction to the bundler
   * @param transaction
   */

  uploadTransaction(
    transaction: DataItem | Readable | Buffer,
    opts: UploadOptions & { getReceiptSignature: true }
  ): Promise<AxiosResponse<UploadReceipt>>;
  uploadTransaction(
    transaction: DataItem | Readable | Buffer,
    opts?: UploadOptions
  ): Promise<AxiosResponse<UploadResponse>>;

  public async uploadTransaction(
    transaction: DataItem | Readable | Buffer,
    opts?: UploadOptions
  ): Promise<AxiosResponse<UploadResponse>> {
    let res: AxiosResponse<UploadResponse>;
    const isDataItem = this.bundles.DataItem.isDataItem(transaction);
    if (
      this.forceUseChunking ||
      (isDataItem && transaction.getRaw().length >= CHUNKING_THRESHOLD) ||
      !isDataItem
    ) {
      res = await this.chunkedUploader.uploadTransaction(
        isDataItem ? transaction.getRaw() : transaction,
        opts
      );
    } else {
      const { url, timeout, headers: confHeaders } = this.api.getConfig();
      const headers: Record<string, string> = {
        'Content-Type': 'application/octet-stream',
        ...confHeaders,
      };
      if (opts?.paidBy) headers[UploadHeaders.PAID_BY] = opts.paidBy;
      res = await this.api.post(
        new URL(`/tx/${this.token}`, url).toString(),
        transaction.getRaw(),
        {
          headers: headers,
          timeout,
          maxBodyLength: Infinity,
        }
      );
      if (res.status === 201) {
        throw new Error(res.data as any as string);
      }
    }
    switch (res.status) {
      case 402:
        const retryAfterHeader = res?.headers?.['retry-after'];
        const errorMsg =
          '402 error: ' +
          res.data +
          (retryAfterHeader ? ` - retry after ${retryAfterHeader}s` : '');
        throw new Error(errorMsg);
      default:
        if (res.status >= 400) {
          throw new Error(
            `whilst uploading Irys transaction: ${res.status} ${httpErrData(res)}`
          );
        }
    }
    res.data.verify = async (): Promise<boolean> =>
      this.utils.verifyReceipt(res.data as UploadReceipt);
    return res;
  }

  public async uploadData(
    data: string | Buffer | Readable,
    opts?: CreateAndUploadOptions
  ): Promise<UploadResponse> {
    if (typeof data === 'string') {
      data = Buffer.from(data);
    }
    if (Buffer.isBuffer(data)) {
      if (data.length <= CHUNKING_THRESHOLD) {
        const dataItem = this.bundles.createData(
          data,
          this.tokenConfig.getSigner(),
          {
            ...opts,
            anchor:
              opts?.anchor ?? randomBytes(32).toString('base64').slice(0, 32),
          }
        );
        await dataItem.sign(this.tokenConfig.getSigner());
        return (await this.uploadTransaction(dataItem, { ...opts?.upload }))
          .data;
      }
    }
    return (await this.chunkedUploader.uploadData(data, opts)).data;
  }

  // concurrently uploads transactions
  public async concurrentUploader(
    data: (DataItem | Buffer | Readable)[],
    opts?: {
      concurrency?: number;
      resultProcessor?: (
        res: any,
        pool: Stoppable & UsesConcurrency
      ) => Promise<any>;
      logFunction?: (log: string) => Promise<any>;
      itemOptions?: CreateAndUploadOptions;
    }
  ): Promise<{ errors: any[]; results: any[] }> {
    const errors = [] as Error[];
    const logFn = opts?.logFunction
      ? opts?.logFunction
      : async (_: any): Promise<any> => {
          return;
        };
    const concurrency = opts?.concurrency ?? 5;
    const results = (await PromisePool.for(data)
      .withConcurrency(concurrency >= 1 ? concurrency : 5)
      .handleError(async (error, _, pool) => {
        errors.push(error);
        if (error.message.includes('402 error')) {
          pool.stop();
          throw error;
        }
      })
      .process(async (item, i, pool) => {
        await retry(
          async (bail) => {
            try {
              const res = await this.processItem(item, opts?.itemOptions);
              if (i % concurrency == 0) {
                await logFn(`Processed ${i} Items`);
              }
              if (opts?.resultProcessor) {
                return await opts.resultProcessor({ item, res, i }, pool);
              } else {
                return { item, res, i };
              }
            } catch (e: any) {
              if (e?.message.includes('402 error')) {
                bail(e);
              }
              throw e;
            }
          },
          { retries: 3, minTimeout: 1000, maxTimeout: 10_000 }
        );
      })) as any;
    return { errors, results: results.results };
  }

  protected async processItem(
    data: string | Buffer | Readable | DataItem,
    opts?: CreateAndUploadOptions
  ): Promise<any> {
    if (this.bundles.DataItem.isDataItem(data)) {
      return this.uploadTransaction(data, { ...opts?.upload });
    }
    return this.uploadData(data, opts);
  }

  /**
   * geneates a folder/path manifest JSON object
   * @param config.items mapping of logical paths to item IDs
   * @param config.indexFile optional logical path of the index file for the manifest
   * @returns
   */
  public async generateFolder(config: {
    items: Map<string, string>;
    indexFile?: string;
  }): Promise<Manifest> {
    const { items, indexFile } = config;
    const manifest: Manifest = {
      manifest: 'irys/paths',
      version: '0.1.0',
      paths: {},
    };
    if (indexFile) {
      if (!items.has(indexFile)) {
        throw new Error(`Unable to access item: ${indexFile}`);
      }
      manifest.index = { path: indexFile };
    }
    for (const [k, v] of items.entries()) {
      // @ts-expect-error constant index type
      manifest.paths[k] = { id: v };
    }
    return manifest;
  }

  get chunkedUploader(): ChunkingUploader {
    return new ChunkingUploader(this.tokenConfig, this.api);
  }

  set useChunking(state: boolean) {
    if (typeof state === 'boolean') {
      this.forceUseChunking = state;
    }
  }

  set contentType(type: string) {
    // const fullType = mime.contentType(type)
    // if(!fullType){
    //     throw new Error("Invali")
    // }
    this.contentTypeOverride = type;
  }

  /**
   * Creates & Uploads a [nested bundle](https://docs.bundlr.network/faqs/dev-faq#what-is-a-nested-bundle) from the provided list of transactions. \
   * NOTE: If a provided transaction is unsigned, the transaction is signed using a temporary (throwaway) key. \
   * This means transactions can be associated with a single "random" address. \
   * NOTE: If a Buffer is provided, it is converted into a transaction and then signed by the throwaway key. \
   * The throwaway key, address, and all bundled (provided + throwaway signed + generated) transactions are returned by this method.
   *
   * @param transactions List of transactions (DataItems/Raw data buffers) to bundle
   * @param opts Standard upload options, plus the `throwawayKey` parameter, for passing your own throwaway JWK, and `bundleOpts` for passing through additional options for the tx containing the bundle.
   * @returns Standard upload response from the bundler node, plus the throwaway key & address, and the list of bundled transactions
   */
  uploadBundle(
    transactions: (DataItem | Buffer | string)[],
    opts: UploadOptions & {
      getReceiptSignature: true;
      throwawayKey?: JWKInterface;
      bundleOpts?: DataItemCreateOptions;
    }
  ): Promise<
    AxiosResponse<UploadReceipt> & {
      throwawayKey: JWKInterface;
      throwawayKeyAddress: string;
      txs: DataItem[];
    }
  >;
  uploadBundle(
    transactions: (DataItem | Buffer)[],
    opts?: UploadOptions & {
      throwawayKey?: JWKInterface;
      bundleOpts?: DataItemCreateOptions;
    }
  ): Promise<
    AxiosResponse<UploadResponse> & {
      throwawayKey: JWKInterface;
      throwawayKeyAddress: string;
      txs: DataItem[];
    }
  >;

  public async uploadBundle(
    transactions: (IrysTransaction | DataItem | Buffer)[],
    opts?: UploadOptions & {
      throwawayKey?: JWKInterface;
      bundleOpts?: DataItemCreateOptions;
    }
  ): Promise<
    AxiosResponse<UploadResponse> & {
      throwawayKey: JWKInterface;
      throwawayKeyAddress: string;
      txs: DataItem[];
    }
  > {
    const { tx, txs, throwawayKey, throwawayKeyAddress } =
      await this.createBundle(transactions, opts);
    const res = await this.uploadTransaction(tx, opts);
    return { ...res, txs, throwawayKey, throwawayKeyAddress };
  }

  public async createBundle(
    transactions: (IrysTransaction | DataItem | Buffer)[],
    opts?: UploadOptions & {
      throwawayKey?: JWKInterface;
      bundleOpts?: DataItemCreateOptions;
    }
  ): Promise<{
    throwawayKey: JWKInterface;
    throwawayKeyAddress: string;
    tx: DataItem;
    txs: DataItem[];
  }> {
    const throwawayKey =
      opts?.throwawayKey ??
      (await this.bundles.getCryptoDriver().generateJWK());
    const ephemeralSigner = new ArweaveSigner(throwawayKey);
    const txs = transactions.map((tx) =>
      this.bundles.DataItem.isDataItem(tx)
        ? tx
        : this.bundles.createData(tx, ephemeralSigner)
    );
    const bundle = await this.bundles.bundleAndSignData(txs, ephemeralSigner);

    // upload bundle with bundle specific tags, use actual signer for this.
    const tx = this.bundles.createData(
      bundle.getRaw(),
      this.tokenConfig.getSigner(),
      {
        ...opts?.bundleOpts,
        tags: [
          { name: 'Bundle-Format', value: 'binary' },
          { name: 'Bundle-Version', value: '2.0.0' },
          ...(opts?.bundleOpts?.tags ?? []),
        ],
      }
    );
    const throwawayKeyAddress = base64url(
      Buffer.from(
        await this.bundles
          .getCryptoDriver()
          .hash(base64url.toBuffer(base64url(ephemeralSigner.publicKey)))
      )
    );
    await tx.sign(this.tokenConfig.getSigner());
    return { tx, throwawayKey, throwawayKeyAddress, txs };
  }
}

export default Uploader;
