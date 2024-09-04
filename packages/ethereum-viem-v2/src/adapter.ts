import BigNumber from "bignumber.js";
import type { Tx } from "@irys/core-bundler-client/types";
import {EthereumConfig} from "@irys/web-upload-ethereum/ethereum";
import type { http } from "viem";
import type { PublicClient, WalletClient } from "viem";
import type { mainnet } from "viem/chains";
import { InjectedTypedEthereumSigner } from "arbundles/web";

export const getV2Adapter  = (base: {new(...args: any): EthereumConfig}, opts: {publicClient: PublicClient<ReturnType<typeof http>, typeof mainnet>, accountIndex: number }): {new(...args: any): EthereumConfig} => {
  const accountIndex = opts.accountIndex ?? 0
  return class Viemv2 extends base {
    protected declare provider: WalletClient;
    public async createTx(amount: BigNumber.Value, to: string, _fee?: string | undefined): Promise<{ txId: string | undefined; tx: any }> {
      const config = {
        account: this.address,
        to,
        value: amount.toString(),
      };

      return {
        txId: undefined,
        tx: config,
      };
    }
  
    public async getTx(txId: string): Promise<Tx> {
      const tx = await opts.publicClient.getTransaction({ hash: txId as `0x${string}` });
      const currentHeight = await opts.publicClient.getBlockNumber();
      return {
        to: tx.to!,
        from: tx.from,
        blockHeight: new BigNumber(tx.blockNumber.toString()),
        amount: new BigNumber(tx.value.toString()),
        pending: tx.blockNumber ? false : true,
        confirmed: currentHeight - tx.blockNumber >= this.minConfirm,
      };
    }

    public getSigner() {
      if (!this.signer) {
        this.signer = new InjectedTypedEthereumSigner({
          getSigner: () => ({
            getAddress: async () => this.provider.getAddresses().then((r: (string | PromiseLike<`0x${string}`>)[]) => r[accountIndex]),
            _signTypedData: async (domain, types, message): Promise<string> => {
              message["Transaction hash"] = "0x" + Buffer.from(message["Transaction hash"]).toString("hex");
              // @ts-expect-error types
              return await  this.provider.signTypedData({ account: message.address, domain, types, primaryType: "Bundlr", message });
            },
          }),
        });
      }
      return this.signer;
    }
  
    async getFee(amount: BigNumber.Value, to?: string): Promise<BigNumber> {
        return new BigNumber(0)
    }
    async sendTx(data: { account: `0x${string}`; to: `0x${string}`; value: bigint }): Promise<string> {
      return await this.provider.sendTransaction({ account: data.account, to: data.to, value: data.value, chain: this.provider.chain });

    }
  
    public async ready(): Promise<void> {
      await (await this.getSigner()).ready();
      this._address = await this.provider.getAddresses().then((r: { toString: () => string; }[]) => r[accountIndex].toString().toLowerCase());
      this.providerInstance = this.wallet;
    }
  }
  
} 


