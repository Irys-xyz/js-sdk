import { type Adapter } from "@irys/web-upload/builder";


export function EthersV5Adapter(provider: any): Adapter {
    return  {
        phase: "pre",
        adaptTokenPre(builder, _tokenConfig) {
            builder.withProvider(provider)
            // todo: add validation here
            // builder.token = getV6Adapter(tokenConfig as {new(...args: any): EthereumConfig})
        },
    }

}