import { Irys, IrysConfig, Network
 } from "@irys-network/core-bundler-client";
import { WebIrysConfig, WebToken } from "./types";
import {BaseWebIrys} from "./base";

type Adapter = {adaptToken: (tokenConfig: WebToken) => Promise<WebToken>}
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
    public adapter: Adapter | undefined
    public token: ConstructableWebToken
    protected provider: any
    protected config: WebIrysConfig & { config: IrysConfig, network: Network}
    

    constructor(tokenClass: ConstructableWebToken) {
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
    public withAdapter(adapter: ConstructableWebToken) {
        this.token = adapter
        return this
    }

    public async build() {
        if(!this.provider) throw new Error("Missing required provider");
        const irys = new BaseWebIrys({
            url: this.config.url,
            network: this.config.network,
            config: this.config.config,
            getTokenConfig: async (irys) => {
                const constructed = new this.token({irys, wallet: this.provider, providerUrl: this.config.config.providerUrl})
                const adapted = this.adapter ? await this.adapter.adaptToken(constructed) : constructed
                return adapted
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