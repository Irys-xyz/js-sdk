import "@irys-network/core-bundler-client/hack";
import Api from "@irys-network/core-bundler-client/api";
import Fund from "@irys-network/core-bundler-client/fund";
import Irys from "@irys-network/core-bundler-client/irys";
import Utils from "@irys-network/core-bundler-client/utils";
import { Provenance } from "@irys-network/core-bundler-client/provenance";
import { Transaction } from "@irys-network/core-bundler-client/transactions";
import type { WebToken } from "./types";
import * as arbundles from "./utils";
import { WebUploader } from "./upload";
import type { IrysConfig, Network } from "@irys-network/core-bundler-client/types";
import { Approval } from "@irys-network/core-bundler-client/approval";
import { Resolvable } from "./builder";

export class BaseWebIrys extends Irys {
  public declare tokenConfig: WebToken;
  public declare uploader: WebUploader;
  uploadFolder!: InstanceType<typeof WebUploader>["uploadFolder"];
  uploadFile!: InstanceType<typeof WebUploader>["uploadFile"];
  public getTokenConfig!:  (irys: BaseWebIrys) => Resolvable<WebToken>;

  // static async build({
  //   url,
  //   network,
  //   wallet,
  //   config,
  //   getTokenConfig,
  // }: {
  //   network?: Network;
  //   url?: string;
  //   wallet?: { rpcUrl?: string; name?: string; provider: object };
  //   config?: IrysConfig;
  //   getTokenConfig: (irys: BaseWebIrys) => Resolvable<WebToken>;
  // }) {
  //   // @ts-expect-error types
  //   super({ url, network, arbundles });

  //   this.debug = config?.debug ?? false;

  //   this.api = new Api({
  //     url: this.url,
  //     timeout: config?.timeout ?? 100000,
  //     headers: config?.headers,
  //   });

    
  // }

  constructor({
    url,
    network,
    wallet,
    config,
    getTokenConfig,
  }: {
    network?: Network;
    url?: string;
    wallet?: { rpcUrl?: string; name?: string; provider: object };
    config?: IrysConfig;
    getTokenConfig: (irys: BaseWebIrys) => Resolvable<WebToken>;
  }) {
    // @ts-expect-error types
    super({ url, network, arbundles });

    this.debug = config?.debug ?? false;

    this.api = new Api({
      url: this.url,
      timeout: config?.timeout ?? 100000,
      headers: config?.headers,
    });
    this.getTokenConfig = getTokenConfig
    
  }

 // todo: redo this part of the API
  public async build({wallet, config} :{
    wallet?: { rpcUrl?: string; name?: string; provider: object };
    config?: IrysConfig;
  }) {
    this.tokenConfig = await this.getTokenConfig(this);
    if (this.url.host.includes("devnet.irys.xyz") && !(config?.providerUrl || wallet?.rpcUrl || this?.tokenConfig?.inheritsRPC))
      throw new Error(`Using ${this.url.host} requires a dev/testnet RPC to be configured! see https://docs.irys.xyz/developer-docs/using-devnet`);

    this.token = this.tokenConfig.name;
    this.utils = new Utils(this.api, this.token, this.tokenConfig);
    this.uploader = new WebUploader(this);
    this.funder = new Fund(this.utils);
    this.uploader = new WebUploader(this);
    this.provenance = new Provenance(this);
    this.transactions = new Transaction(this);
    this.approval = new Approval(this);
    this.address = "Please run `await Irys.ready()`";
    this.uploadFolder = this.uploader.uploadFolder.bind(this.uploader);
    this.uploadFile = this.uploader.uploadFile.bind(this.uploader);
  }
}
export default BaseWebIrys