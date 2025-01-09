import BaseNodeIrys from "@irys/upload/base";
import BaseStarknetToken from "./token";
import type { IrysConfig } from "@irys/upload-core";


type TokenOptions = {
    privateKey?: string;
    address?: string;
    tokenBase: [string, number | undefined]
  };
  
  // Update the NodeIrysConfig type to include TokenOptions for tokenOpts
  interface NodeIrysConfig<T> {
    url: string;
    key: string;
    config?: IrysConfig
    tokenOpts:TokenOptions
  }
export default class StarknetIrys extends BaseNodeIrys {
  constructor({ url, key, config,tokenOpts }: NodeIrysConfig<string>) {
    super({
      url,
      config,
      getTokenConfig: (irys) =>
        new BaseStarknetToken({
          irys,
          name: "starknet",
          ticker: "STRK",
          providerUrl: config?.providerUrl ?? "",
          wallet: key,
          opts: config?.tokenOpts,
          address: tokenOpts?.address ?? "",
          contractAddress: config?.contractAddress ?? "",
          contractBase: tokenOpts.tokenBase
        }),
    });
  }
}
