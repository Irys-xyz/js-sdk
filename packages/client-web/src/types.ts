import type { IrysConfig, Network, Token } from "@irys-network/core-bundler-client/types";

export interface WebToken extends Token {
  getPublicKey(): Promise<string | Buffer>;
  ready(): Promise<void>;
  inheritsRPC: boolean;
}

export type WebIrysConfig<Provider = any> = {
  url: Network | string;
  provider: Provider;
  config?: IrysConfig 
};