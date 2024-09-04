import type { IrysConfig, Network, Token } from "packages/upload-core/dist/types/types";

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