import { IrysConfig, Network } from '@irys/upload-core';
import { NodeIrysConfig, NodeToken } from './types';
import { BaseNodeIrys } from './base';
import { Irys } from '@irys/upload-core';

// UNSTABLE
export type Adapter = PreAdapter | PostAdapter | BiphaseAdapter;

export interface BaseAdapter {
  phase: 'pre' | 'post' | 'both';
  // custom function run on adapter load
  // useful for
  load?: (builder: this) => void;
}

export interface PreAdapter extends BaseAdapter {
  phase: 'pre';
  adaptTokenPre: (
    builder: UploadBuilder,
    tokenConfig: ConstructableNodeToken
  ) => Resolvable<void>;
}

export interface PostAdapter extends BaseAdapter {
  phase: 'post';
  adaptTokenPost: (
    builder: UploadBuilder,
    tokenConfig: NodeToken
  ) => Resolvable<void>;
}

export interface BiphaseAdapter extends BaseAdapter {
  phase: 'both';
  adaptTokenPre: (
    builder: UploadBuilder,
    tokenConfig: ConstructableNodeToken
  ) => Resolvable<void>;
  adaptTokenPost: (
    builder: UploadBuilder,
    tokenConfig: NodeToken
  ) => Resolvable<void>;
}

export type Resolvable<T> = T | Promise<T>;
export type Constructable<A extends any[], T> = {
  new (...args: A): T;
};
export type ConstructableNodeToken = Constructable<
  [TokenConfigTrimmed],
  NodeToken
>;

// type FnResolvable<T, U extends any[] = any[]> = T | ((...args: U) => T)

export type TokenConfigTrimmed<Wallet = string | object, Opts = any> = {
  irys: Irys;
  wallet?: Wallet;
  providerUrl?: string;
  opts?: Opts;
};

export class UploadBuilder {
  public preAdapters: (PreAdapter | BiphaseAdapter)[];
  public postAdapters: (PostAdapter | BiphaseAdapter)[];
  public token: ConstructableNodeToken;
  protected wallet: any;
  public config: NodeIrysConfig & { irysConfig: IrysConfig };
  public constructed?: NodeToken;

  constructor(tokenClass: ConstructableNodeToken) {
    this.preAdapters = [];
    this.postAdapters = [];

    this.token = tokenClass;
    this.config = {
      url: 'mainnet',
      key: undefined,
      irysConfig: {},
    };
  }

  public withWallet(wallet: any) {
    if (!wallet) throw new Error('Provided wallet is undefined');
    this.wallet = wallet;
    return this;
  }

  public mainnet() {
    this.config.url = 'mainnet';
    return this;
  }
  public devnet() {
    this.config.url = 'devnet';
    return this;
  }

  public withRpc(rpcUrl: string) {
    this.config.irysConfig.providerUrl = rpcUrl;
    return this;
  }

  public bundlerUrl(url: URL | string) {
    this.config.url = new URL(url).toString();
    return this;
  }

  public network(network: Network) {
    this.config.url = network;
    return this;
  }

  public withAdapter(adapter: Adapter) {
    // this.adapters.push(adapter)
    if (adapter.phase != 'post') this.preAdapters.push(adapter);
    if (adapter.phase != 'pre') this.postAdapters.push(adapter);
    // @ts-expect-error type intersection issues
    if (adapter.load) adapter.load(this);
    return this;
  }

  public async build(): Promise<BaseNodeIrys> {
    const irys = new BaseNodeIrys({
      url: this.config.url,
      config: this.config.irysConfig,
      getTokenConfig: async (irys) => {
        for (const preAdapter of this.preAdapters) {
          await preAdapter.adaptTokenPre(this, this.token);
        }
        this.constructed = new this.token({
          irys,
          wallet: this.wallet,
          providerUrl: this.config.irysConfig.providerUrl,
          opts: this.config.irysConfig.tokenOpts,
        });
        for (const postAdapter of this.postAdapters) {
          await postAdapter.adaptTokenPost(this, this.constructed);
        }
        return this.constructed;
      },
    });
    await irys.build({ wallet: this.wallet, config: this.config.irysConfig });
    await irys.ready();
    return irys;
  }

  // todo: add generics
  public withTokenOptions(opts: any) {
    this.config.irysConfig.tokenOpts = opts;
    return this;
  }

  public withIrysConfig(config: IrysConfig) {
    this.config.irysConfig = { ...this.config.irysConfig, ...config };
    return this;
  }

  /**
   * Set the HTTP request timeout - useful if you have a slower connection
   * @param timeout - timeout in milliseconds
   * @returns this (builder)
   */
  public timeout(timeout: number) {
    this.config.irysConfig.timeout = timeout;
    return this;
  }

  // Promise contract functions, so users can `await` a builder instance to resolve the builder, instead of having to call build().
  // very cool, thanks Knex.
  public async then(
    onFulfilled?:
      | ((value: BaseNodeIrys) => any | PromiseLike<BaseNodeIrys>)
      | undefined
      | null,
    onRejected?: (value: Error) => any | PromiseLike<Error> | undefined | null
  ): Promise<BaseNodeIrys | never> {
    const res = this.build();
    return res.then(onFulfilled, onRejected);
  }

  public async catch(
    onReject?:
      | ((value: BaseNodeIrys) => any | PromiseLike<BaseNodeIrys>)
      | undefined
      | null
  ): Promise<null> {
    return this.then().catch(onReject);
  }

  public async finally(
    onFinally?: (() => void) | null | undefined
  ): Promise<BaseNodeIrys | null> {
    return this.then().finally(onFinally);
  }
}

// function isClass(target: any): target is { new (...args: any[]): any } {
//     return target && typeof target === "function" && (/^(object|array)$/i.test(target.constructor.name) === false)
//   }
export const Builder = (tokenClass: ConstructableNodeToken): UploadBuilder => {
  return new UploadBuilder(tokenClass);
};
