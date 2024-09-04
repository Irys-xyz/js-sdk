import BaseNodeIrys from "@irys/upload/base";
import BaseEthereumToken from "./ethereum";
import type { NodeIrysConfig } from "@irys/upload/types";

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
