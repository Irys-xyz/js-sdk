import BaseEthereumToken from "./token";
import {Builder, type TokenConfigTrimmed} from "@irys-network/bundler-client-web/builder"
 export class EthereumToken extends BaseEthereumToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "ethereum", ticker: "ETH", providerUrl: config.providerUrl ?? "https://cloudflare-eth.com/",
           ...config
         })
    }
}


export function EthereumWebIrys() {
    // return a builder
    return new Builder(EthereumToken)/* .withTokenOptions(opts) */
}
export default EthereumWebIrys