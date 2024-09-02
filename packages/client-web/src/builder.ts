import { Irys, IrysConfig, Network
 } from "@irys-network/core-bundler-client";
import { WebIrysConfig, WebToken } from "./types";
import {BaseWebIrys} from "./base";


/// UNSTABLE
export type Adapter = PreAdapter | PostAdapter | BiphaseAdapter

export interface BaseAdapter {
    phase: "pre" | "post" | "both" 
    // custom function run on adapter load
    // useful for 
    load?: (builder: this) => void
}

export interface PreAdapter extends BaseAdapter  {
    phase: "pre",
    adaptTokenPre: (builder: Builder, tokenConfig: ConstructableWebToken) => Resolvable<void>

}

export interface PostAdapter extends BaseAdapter{
    phase: "post",
    adaptTokenPost: (builder: Builder, tokenConfig: WebToken) =>Resolvable<void>

}

export interface BiphaseAdapter extends BaseAdapter{
    phase: "both",
    adaptTokenPre: (builder: Builder, tokenConfig: ConstructableWebToken) => Resolvable<void>
    adaptTokenPost: (builder: Builder, tokenConfig: WebToken) => Resolvable<void>

}

export type Resolvable<T> = T | Promise<T>
type Constructable<A extends any[], T> = {
    new (...args: A): T
};
type ConstructableWebToken = Constructable<[TokenConfigTrimmed],WebToken>

export type TokenConfigTrimmed<Wallet = string | object, Opts = any> = {
    irys: Irys;
    wallet?: Wallet;
    providerUrl?: string;
    opts?: Opts;
};

export class Builder {
    // public adapters: Adapter[]
    public preAdapters: (PreAdapter | BiphaseAdapter)[]
    public postAdapters: (PostAdapter | BiphaseAdapter)[]
    public token: ConstructableWebToken
    protected provider: any
    protected config: WebIrysConfig & { config: IrysConfig, network: Network}
    public constructed?: WebToken

    constructor(tokenClass: ConstructableWebToken) {
        this.preAdapters = []
        this.postAdapters = []

        this.token = tokenClass;
        this.config = {
            url: "https://uploader.irys.xyz",
            config: {},
            network: "testnet",
            provider: undefined
        }
    }

    public withProvider(provider: Resolvable<Adapter>){
        this.provider = provider;
        return this
    }

    public testnet() {
        this.config.network = "testnet"
        return this

    }

    public withRpc(rpcUrl: string) {
        this.config.config.providerUrl = rpcUrl
        return this
    }

    public withTokenOptions(opts: any) {
        this.config.config.tokenOpts = opts
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
        if(!this.provider) throw new Error("Missing required provider");
        const irys = new BaseWebIrys({
            url: this.config.url,
            network: this.config.network,
            config: this.config.config,
            getTokenConfig: async (irys) => {
                for (const preAdapter of this.preAdapters) {
                    await preAdapter.adaptTokenPre(this, this.token)
                }
                this.constructed = new this.token({irys, wallet: this.provider, providerUrl: this.config.config.providerUrl})
                for (const postAdapter of this.postAdapters) {
                    await postAdapter.adaptTokenPost(this, this.constructed)
                }
                return this.constructed
            }
        })
        // TODO: fix this - this is required due to the async callback fn
        await irys.build({wallet: this.provider, config: this.config.config})
        await irys.ready();
        return irys
    }

    // Promise contract functions, so users can `await` a builder instance to resolve the builder, instead of having to call build().
    // very cool, thanks Knex.
    public async then(
        onFulfilled?: ((value: BaseWebIrys) => any | PromiseLike<BaseWebIrys>) | undefined | null,
        onRejected?: (value: Error) => any | PromiseLike<Error> | undefined | null,
      ): Promise<BaseWebIrys | never> {
        const res = this.build()
        return res.then(onFulfilled, onRejected);
      }
    
      public async catch(onReject?: ((value: BaseWebIrys) => any | PromiseLike<BaseWebIrys>) | undefined | null): Promise<null> {
        return this.then().catch(onReject);
      }
    
      public async finally(onFinally?: (() => void) | null | undefined): Promise<BaseWebIrys | null> {
        return this.then().finally(onFinally);
      }

}