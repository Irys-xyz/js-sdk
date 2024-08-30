import type { IrysConfig, Token } from "@irys-network/bundler-client-core/types";
import BaseNodeIrys from "./base";
export interface NodeToken extends Token {
  getPublicKey(): string | Buffer;
}

export type NodeIrysConfig<Key = any> = {
  url: "node1" | "node2" | "devnet" | string;
  key: Key;
  config?: IrysConfig;
};

export type GetToken = ({irys, wallet, url, providerUrl, contractAddress, opts }: {irys: BaseNodeIrys, wallet: any, url: string, providerUrl?: string, contractAddress?: string, opts?: any}) => Promise<NodeToken>
