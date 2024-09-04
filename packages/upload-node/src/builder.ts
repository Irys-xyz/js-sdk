import {  IrysConfig, Network
 } from "@irys/upload-core/types";
import { NodeIrysConfig, NodeToken } from "./types";
import {BaseNodeIrys} from "./base";
import { Irys } from "@irys/upload-core";

// UNSTABLE
export type Adapter = PreAdapter | PostAdapter | BiphaseAdapter

export interface BaseAdapter {
    phase: "pre" | "post" | "both" 
    // custom function run on adapter load
    // useful for 
    load?: (builder: this) => void
}

export interface PreAdapter extends BaseAdapter  {
    phase: "pre",
    adaptTokenPre: (builder: Builder, tokenConfig: ConstructableNodeToken) => Resolvable<void>

}

export interface PostAdapter extends BaseAdapter{
    phase: "post",
    adaptTokenPost: (builder: Builder, tokenConfig: NodeToken) =>Resolvable<void>

}

export interface BiphaseAdapter extends BaseAdapter{
    phase: "both",
    adaptTokenPre: (builder: Builder, tokenConfig: ConstructableNodeToken) => Resolvable<void>
    adaptTokenPost: (builder: Builder, tokenConfig: NodeToken) => Resolvable<void>

}

export type Resolvable<T> = T | Promise<T>
export type Constructable<A extends any[], T> = {
    new (...args: A): T
};
export type ConstructableNodeToken = Constructable<[TokenConfigTrimmed],NodeToken>

// type FnResolvable<T, U extends any[] = any[]> = T | ((...args: U) => T)  

export type TokenConfigTrimmed<Wallet = string | object, Opts = any> = {
    irys: Irys;
    wallet?: Wallet;
    providerUrl?: string;
    opts?: Opts;
};

export class Builder {
    public preAdapters: (PreAdapter | BiphaseAdapter)[]
    public postAdapters: (PostAdapter | BiphaseAdapter)[]
    public token: ConstructableNodeToken
    protected wallet: any
    protected config: NodeIrysConfig & { config: IrysConfig, network: Network}
    public constructed?: NodeToken

    constructor(tokenClass: ConstructableNodeToken) {
        this.preAdapters = []
        this.postAdapters = []

        this.token = tokenClass;
        this.config = {
            url: "https://uploader.irys.xyz",
            key: undefined,
            config: {},
            network: "testnet"
        }
    }

    public withWallet(wallet: any){
        this.wallet = wallet;
        return this
    }

    public mainnet() {
        this.config.network = "testnet"
        return this

    }

    public withRpc(rpcUrl: string) {
        this.config.config.providerUrl = rpcUrl
        return this
    }
    
    public bundlerUrl(url: URL) {
        this.config.url = url.toString()
        return this
    }

    public withAdapter(adapter: Adapter) {
        // this.adapters.push(adapter)
        if(adapter.phase != "post") this.preAdapters.push(adapter)
        if(adapter.phase != "pre") this.postAdapters.push(adapter)
            // @ts-expect-error type intersection issues
        if(adapter.load) adapter.load(this)
        return this
    }

    public async build() {

        const irys = new BaseNodeIrys({
            url: this.config.url,
            network: this.config.network,
            config: this.config.config,
            getTokenConfig: async (irys) => {
                for (const preAdapter of this.preAdapters) {
                    await preAdapter.adaptTokenPre(this, this.token)
                }
                this.constructed = new this.token({irys, wallet: this.wallet, providerUrl: this.config.config.providerUrl})
                for (const postAdapter of this.postAdapters) {
                    await postAdapter.adaptTokenPost(this, this.constructed)
                }
                return this.constructed
        
            }
        })
        await irys.build({wallet: this.wallet, config: this.config.config})
        await irys.ready();
        return irys
    }

    // todo: add generics
    public withTokenOptions(opts: any) {
        this.config.config.tokenOpts = opts
        return this
    }

    // Promise contract functions, so users can `await` a builder instance to resolve the builder, instead of having to call build().
    // very cool, thanks Knex.
  public async then(
    onFulfilled?: ((value: BaseNodeIrys) => any | PromiseLike<BaseNodeIrys>) | undefined | null,
    onRejected?: (value: Error) => any | PromiseLike<Error> | undefined | null,
  ): Promise<BaseNodeIrys | never> {
    const res = this.build()
    return res.then(onFulfilled, onRejected);
  }

  public async catch(onReject?: ((value: BaseNodeIrys) => any | PromiseLike<BaseNodeIrys>) | undefined | null): Promise<null> {
    return this.then().catch(onReject);
  }

  public async finally(onFinally?: (() => void) | null | undefined): Promise<BaseNodeIrys | null> {
    return this.then().finally(onFinally);
  }
}


// function isClass(target: any): target is { new (...args: any[]): any } {
//     return target && typeof target === "function" && (/^(object|array)$/i.test(target.constructor.name) === false)
//   }