import { Irys, IrysConfig, Network
 } from "@irys-network/bundler-client-core";
import { NodeIrysConfig, NodeToken } from "./types";
import {BaseNodeIrys} from "./base";

export type Adapter = (adapter: NodeToken) => Promise<NodeToken>
export type Constructable<A extends any[], T> = {
    new (...args: A): T
};
type ConstructableNodeToken = Constructable<[TokenConfigTrimmed],NodeToken>

// type FnResolvable<T, U extends any[] = any[]> = T | ((...args: U) => T)  

export type TokenConfigTrimmed<Wallet = string | object, Opts = any> = {
    irys: Irys;
    wallet?: Wallet;
    providerUrl?: string;
    opts?: Opts;
};

export class Builder {
    public adapter: Adapter | undefined
    public token: ConstructableNodeToken
    protected wallet: any
    protected config: NodeIrysConfig & { config: IrysConfig, network: Network}
    

    constructor(tokenClass: ConstructableNodeToken) {
        
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

    public testnet() {
        this.config.network = "testnet"
        return this

    }
    public withRpc(rpcUrl: string) {
        this.config.config.providerUrl = rpcUrl
        return this
    }

    public async build() {
        const irys = new BaseNodeIrys({
            url: this.config.url,
            network: this.config.network,
            config: this.config.config,
            getTokenConfig: (irys) => {
            
                const constructed = new this.token({irys, wallet: this.wallet, providerUrl: this.config.config.providerUrl, opts: this.config.config.tokenOpts})
                return constructed
            }
        })
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