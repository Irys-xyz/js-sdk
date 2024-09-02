import { Finality } from "@solana/web3.js";
import BaseSolanaToken from "./token";
import {Builder, type TokenConfigTrimmed} from "@irys-network/bundler-client/builder"
 export class SolanaToken extends BaseSolanaToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "solana", ticker: "SOL", providerUrl: config.providerUrl ?? "https://api.mainnet-beta.solana.com/",
           ...config
         })
    }
}


function getBoundSolana({name, ticker, providerUrl}: {name: string, ticker: string, providerUrl: string}) {
    return class SolanaToken extends BaseSolanaToken {
        constructor(config: TokenConfigTrimmed) {
            super({name, ticker, providerUrl: config.providerUrl ?? providerUrl,
               ...config
             })
        }
    }
}

export function SolanaBundlerIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
    // return a builder
    return new Builder(SolanaToken).withTokenOptions(opts)
}
export default SolanaBundlerIrys

export function EclipseBundlerIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
    return new Builder(getBoundSolana({name: "eclipse", ticker: "ETH", providerUrl:  "https://mainnetbeta-rpc.eclipse.xyz"}))
    .withTokenOptions(opts)
}