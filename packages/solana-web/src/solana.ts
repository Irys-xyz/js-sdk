import { Finality } from "@solana/web3.js";
import BaseSolanaToken from "./token";
import {Builder, type TokenConfigTrimmed} from "@irys-network/bundler-client-web/builder"
 export class SolanaToken extends BaseSolanaToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "solana", ticker: "SOL", providerUrl: config.providerUrl ?? "https://api.mainnet-beta.solana.com/",
           ...config
         })
    }
}


export function SolanaWebIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
    // return a builder
    return new Builder(SolanaToken).withTokenOptions(opts)
}
export default SolanaWebIrys