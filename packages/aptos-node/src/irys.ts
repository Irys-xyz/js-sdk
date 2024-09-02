import { Network } from "@aptos-labs/ts-sdk";
import BaseAptosToken from "./token";
import {Builder, type TokenConfigTrimmed} from "@irys-network/node-bundler-client/builder"

 export class AptosToken extends BaseAptosToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "aptos", ticker: "APT", providerUrl: config.providerUrl ??  Network.MAINNET,
           ...config
         })
    }
}


export function AptosNodeIrys() {
    return new Builder(AptosToken)/* .withTokenOptions(opts) */
}
export default AptosNodeIrys