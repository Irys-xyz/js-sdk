// import { Finality } from "@solana/web3.js";
import BaseSolanaToken from "./token";
import {Constructable, type TokenConfigTrimmed} from "@irys/upload/builder"
import { BaseNodeToken } from "@irys/upload/tokens/base";
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
               providerUrl: config.providerUrl ?? providerUrl
             })
        }
    }
}

// export function SolanaBundlerIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
//     // return a builder
//     return new Builder(SolanaToken).withTokenOptions(opts)
// }
// export default SolanaBundlerIrys

// export function EclipseBundlerIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
//     return new Builder(getBoundSolana({name: "eclipse", ticker: "ETH", providerUrl:  "https://mainnetbeta-rpc.eclipse.xyz"}))
//     .withTokenOptions(opts)
// }

export const Solana: Constructable<[TokenConfigTrimmed], BaseNodeToken> = SolanaToken
export default Solana

export const Eclipse: Constructable<[TokenConfigTrimmed], BaseNodeToken> = getBoundSolana({name: "eclipse", ticker: "ETH", providerUrl:  "https://mainnetbeta-rpc.eclipse.xyz"})