import { IrysConfig, Network} from "@irys/upload-core";
import { WebIrysConfig, WebToken } from "./types";
import {BaseWebIrys} from "./base";
import { Irys } from "@irys/upload-core";


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
    adaptTokenPre: (builder: UploadBuilder, tokenConfig: ConstructableWebToken) => Resolvable<void>

}

export interface PostAdapter extends BaseAdapter{
    phase: "post",
    adaptTokenPost: (builder: UploadBuilder, tokenConfig: WebToken) =>Resolvable<void>

}

export interface BiphaseAdapter extends BaseAdapter{
    phase: "both",
    adaptTokenPre: (builder: UploadBuilder, tokenConfig: ConstructableWebToken) => Resolvable<void>
    adaptTokenPost: (builder: UploadBuilder, tokenConfig: WebToken) => Resolvable<void>

}

export type Resolvable<T> = T | Promise<T>
export type Constructable<A extends any[], T> = {
    new (...args: A): T
};
export type ConstructableWebToken<T extends any[] =[TokenConfigTrimmed]>  = Constructable<T,WebToken>

export type TokenConfigTrimmed<Wallet = string | object, Opts = any> = {
    irys: Irys;
    wallet?: Wallet;
    providerUrl?: string;
    opts?: Opts;
};

export class UploadBuilder {
    // public adapters: Adapter[]
    public preAdapters: (PreAdapter | BiphaseAdapter)[]
    public postAdapters: (PostAdapter | BiphaseAdapter)[]
    public token: ConstructableWebToken
    protected provider: any
    public config: WebIrysConfig & { irysConfig: IrysConfig}
    public constructed?: WebToken

    constructor(tokenClass: ConstructableWebToken) {
        this.preAdapters = []
        this.postAdapters = []

        this.token = tokenClass;
        this.config = {
            url: "testnet",
            irysConfig: {},
            provider: undefined
        }
    }

    public withProvider(provider:any){
        this.provider = provider;
        return this
    }

    public mainnet() {
        this.config.url = "testnet"
        return this

    }
    public devnet() {
        this.config.url = "devnet"
        return this
    }
    
    public withRpc(rpcUrl: string) {
        this.config.irysConfig.providerUrl = rpcUrl
        return this
    }

    public withTokenOptions(opts: any) {
        this.config.irysConfig.tokenOpts = opts
        return this
    }

    public bundlerUrl(url: URL | string) {
        this.config.url = new URL(url).toString()
        return this
    }

    public network(network: Network) {
        this.config.url = network
        return this
    }

    public withIrysConfig(config: IrysConfig) {
        this.config.irysConfig = {...this.config.irysConfig, ...config}
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
        const irys = new BaseWebIrys({
            url: this.config.url,
            config: this.config.irysConfig,
            getTokenConfig: async (irys) => {
                for (const preAdapter of this.preAdapters) {
                    await preAdapter.adaptTokenPre(this, this.token)
                }
                if(!this.provider) throw new Error("Missing required provider");
                this.constructed = new this.token({irys, wallet: this.provider, providerUrl: this.config.irysConfig.providerUrl, opts: this.config.irysConfig.tokenOpts})
                for (const postAdapter of this.postAdapters) {
                    await postAdapter.adaptTokenPost(this, this.constructed)
                }
                return this.constructed
            }
        })
        // TODO: fix this - this is required due to the async callback fn
        await irys.build({wallet: this.provider, config: this.config.irysConfig})
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

export const Builder = (tokenClass: ConstructableWebToken): UploadBuilder => {
    return new UploadBuilder(tokenClass)
}