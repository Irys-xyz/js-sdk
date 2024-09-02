import { Network } from "@aptos-labs/ts-sdk";
import BaseAptosToken from "./token";
import {Builder, type TokenConfigTrimmed} from "@irys-network/bundler-client/builder"

 export class AptosToken extends BaseAptosToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "aptos", ticker: "APT",
           ...config,
           providerUrl: config.providerUrl ??  Network.MAINNET
         })
    }
}


export function AptosBundlerIrys() {
    return new Builder(AptosToken)/* .withTokenOptions(opts) */
}
export default AptosBundlerIrys