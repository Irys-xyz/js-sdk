import type { InjectedTypedEthereumSignerMinimalSigner } from "@irys/bundles/web";
import BigNumber from "bignumber.js";
import { BigNumber as EthBigNumber } from "@ethersproject/bignumber";
import type { BrowserProvider, JsonRpcSigner, TypedDataDomain } from "ethers";
import type { Tx } from "@irys/upload-core";
import {EthereumConfig, type MinimalProvider} from "@irys/web-upload-ethereum/ethereum";

export const getV6Adapter  = (base: {new(...args: any): EthereumConfig}): {new(...args: any): EthereumConfig} => {
  return class EthereumEthersV6 extends base {
    protected declare provider: BrowserProvider;
  
    public async createTx(amount: BigNumber.Value, to: string, _fee?: string | undefined): Promise<{ txId: string | undefined; tx: any }> {
      const signer = this.w3signer as any as JsonRpcSigner;
      const tx = { to, from: this.address, value: amount.toString(), gasLimit: BigInt(0) };
      const estimatedGas = await this.provider.estimateGas(tx);
      tx.gasLimit = estimatedGas;
      const txr = await signer.populateTransaction(tx);
      return { tx: txr, txId: undefined };
    }
  
    public async getTx(txId: string): Promise<Tx> {
      const provider = this.provider;
      const response = await provider.getTransaction(txId);
  
      if (!response) throw new Error("Tx doesn't exist");
      if (!response.to) throw new Error(`Unable to resolve transactions ${txId} receiver`);
  
      return {
        from: response.from,
        to: response.to,
        blockHeight: response.blockNumber ? new BigNumber(response.blockNumber) : undefined,
        amount: new BigNumber(response.value.toString()),
        pending: response.blockNumber ? false : true,
        confirmed: (await response.confirmations()) >= this.minConfirm,
      };
    }
  
    async getFee(amount: BigNumber.Value, to?: string): Promise<BigNumber> {
      const provider = this.providerInstance;
      const tx = {
        to,
        from: this.address,
        value: "0x" + new BigNumber(amount).toString(16),
      };
  
      const estimatedGas = await provider.estimateGas(tx);
      const gasPrice = await provider.getGasPrice();
      return new BigNumber(gasPrice.mul(estimatedGas).toString());
    }
  
    public async ready(): Promise<void> {
      const provider = this.wallet as any as BrowserProvider;
      this.provider = provider;
      const signer = await provider.getSigner();
      (signer as unknown as InjectedTypedEthereumSignerMinimalSigner)._signTypedData = async (domain, types, value): Promise<string> =>
        signer.signTypedData(domain as TypedDataDomain, types, value);
      // @ts-expect-error fix
      provider.getSigner = (): JsonRpcSigner => signer;
      // @ts-expect-error fix
      this.wallet = provider;
      (provider as unknown as MinimalProvider).getGasPrice = async (): Promise<EthBigNumber> =>
        provider.getFeeData().then((r) => EthBigNumber.from(r.gasPrice ?? 0));
      // @ts-expect-error fix
      this.providerInstance = provider;
      await super.ready();
    }
  }
  
} 


