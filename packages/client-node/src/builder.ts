import { Irys, IrysConfig, Network
 } from "@irys-network/bundler-client-core";
import { NodeIrysConfig, NodeToken } from "./types";
import BaseNodeIrys from "./base";

type Adapter = (adapter: NodeToken) => Promise<NodeToken>
type Constructable<A extends any[], T> = {
    new (...args: A): T
};
type ConstructableNodeToken = Constructable<[TokenConfigTrimmed],NodeToken>

export type TokenConfigTrimmed<Wallet = string | object, Opts = any> = {
    irys: Irys;
    wallet?: Wallet;
    providerUrl?: string;
    opts?: Opts;
};

export class Builder {
    public adapter: Adapter | undefined
    public token:ConstructableNodeToken
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

    public async build(): Promise<BaseNodeIrys> {
        const irys = new BaseNodeIrys({
            url: this.config.url,
            network: this.config.network,
            config: this.config.config,
            getTokenConfig: (irys) => {
                const constructed = new this.token({irys, wallet: this.wallet, providerUrl: this.config.config.providerUrl})
                return constructed
            }
        })
        await irys.ready();
        return irys
    }



}