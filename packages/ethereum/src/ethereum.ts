import BaseEthereumToken from "./token";
import type {TokenConfigTrimmed} from "@irys-network/bundler-client-node/builder"
export class Ethereum extends BaseEthereumToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "ethereum", ticker: "ETH", providerUrl: config.providerUrl ?? "https://cloudflare-eth.com/",
           ...config
         })
    }
}
export default Ethereum