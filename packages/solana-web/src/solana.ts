import { Finality } from "@solana/web3.js";
import BaseSolanaToken from "./token";
import {Builder, type TokenConfigTrimmed} from "@irys-network/web-bundler-client/builder"
 export class SolanaToken extends BaseSolanaToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "solana", ticker: "SOL",
           ...config,
           providerUrl: config.providerUrl ?? "https://api.mainnet-beta.solana.com/",
         })
    }
}

function getBoundSolana({name, ticker, providerUrl}: {name: string, ticker: string, providerUrl: string}) {
    return class SolanaToken extends BaseSolanaToken {
        constructor(config: TokenConfigTrimmed) {
            super({name, ticker, 
               ...config,
               providerUrl: config.providerUrl ?? providerUrl,
             })
        }
    }
}



export function SolanaBundlerWebIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
    // return a builder
    return new Builder(SolanaToken).withTokenOptions(opts)
}
export default SolanaBundlerWebIrys

export function EclipseBundlerWebIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
    return new Builder(getBoundSolana({name: "eclipse", ticker: "ETH", providerUrl:  "https://mainnetbeta-rpc.eclipse.xyz"}))
    .withTokenOptions(opts)
}