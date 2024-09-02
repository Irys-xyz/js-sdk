import type EthereumConfig from "@irys-network/web-bundler-ethereum/ethereum";
import { getV2Adapter } from "./adapter";
import { type Adapter } from "@irys-network/web-bundler-client/builder";
import type { PublicClient } from "viem";

export function ViewV2Adapter(provider: any, opts: {publicClient: PublicClient, accountIndex?: number }): Adapter {
    return  {
        phase: "pre",
        adaptTokenPre(builder, tokenConfig) {
            builder.withProvider(provider)
            // todo: add validation here
            // @ts-expect-error types
            builder.token = getV2Adapter(tokenConfig as {new(...args: any): EthereumConfig}, opts)
        },
    }

}