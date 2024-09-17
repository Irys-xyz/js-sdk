import BaseSolanaToken from "./token";
import {type ConstructableWebToken, type TokenConfigTrimmed} from "@irys/web-upload"
import BaseSPLToken from "./spl";

export class SolanaToken extends BaseSolanaToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "solana", ticker: "SOL",
           ...config,
           providerUrl: config.providerUrl ?? "https://api.mainnet-beta.solana.com/",
         })
    }
}

export class USDCSolana extends BaseSPLToken {
    constructor(config: TokenConfigTrimmed) {
        super({
            ...config,
            name: "usdc-solana",
            ticker: "USDC",
            providerUrl: config.providerUrl ?? "https://api.mainnet-beta.solana.com/",
            contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
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



// export function SolanaBundlerWebIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
//     // return a builder
//     return new Builder(SolanaToken).withTokenOptions(opts)
// }
// export default SolanaBundlerWebIrys

// export function EclipseBundlerWebIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
//     return new Builder(getBoundSolana({name: "eclipse", ticker: "ETH", providerUrl:  "https://mainnetbeta-rpc.eclipse.xyz"}))
//     .withTokenOptions(opts)
// }

export const WebSolana: ConstructableWebToken = SolanaToken
export default WebSolana;
export const WebEclipse: ConstructableWebToken = getBoundSolana({name: "eclipse", ticker: "ETH", providerUrl:  "https://mainnetbeta-rpc.eclipse.xyz"})