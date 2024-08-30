import BaseNodeIrys from "@irys-network/bundler-client-node/base";
import BaseEthereumToken from "./token";
import type { NodeIrysConfig } from "@irys-network/bundler-client-node/types";

export class EthereumIrys extends BaseNodeIrys {
  constructor({ url, key, config }: NodeIrysConfig<string>) {
    super({
      url,
      config,
      getTokenConfig: (irys) =>
        new BaseEthereumToken({
          irys,
          name: "ethereum",
          ticker: "ETH",
          providerUrl: config?.providerUrl ?? "https://cloudflare-eth.com/",
          wallet: key,
          opts: config?.tokenOpts,
        }),
    });
  }
}
