import type EthereumConfig from "@irys-network/web-bundler-ethereum/ethereum";
import { getV6Adapter } from "./adapter";
import { type Adapter } from "@irys-network/web-bundler-client/builder";


export function EthersV6Adapter(provider: any): Adapter {
    return  {
        phase: "pre",
        adaptTokenPre(builder, tokenConfig) {
            builder.withProvider(provider)
            // todo: add validation here
            builder.token = getV6Adapter(tokenConfig as {new(...args: any): EthereumConfig})
        },
    }

}