import BaseWebIrys from "@irys-network/bundler-client-web/base";
import BaseEthereumToken from "./ethereum";
import type {  WebIrysConfig } from "@irys-network/bundler-client-web/types";

export class EthereumIrys extends BaseWebIrys {
  constructor({ url,  provider, config }: WebIrysConfig<string>) {
    super({
      url,
      config,
      getTokenConfig: (irys) =>
        new BaseEthereumToken({
          irys,
          name: "ethereum",
          ticker: "ETH",
          providerUrl: config?.providerUrl ?? "https://cloudflare-eth.com/",
          wallet: provider,
          opts: config?.tokenOpts,
        }),
    });
  }
}

