import type {TokenConfig, Tx} from "@irys/upload-core";
import {BaseNodeToken} from "@irys/upload/tokens/base"
import { Contract, RpcProvider, Provider, Result } from 'starknet';
import { StarknetSigner, Signer } from '@irys/bundles';
import BigNumber from 'bignumber.js';
import { num, Account, uint256 } from 'starknet';
import strkerc20token from "../src/abi/erc20.abi.json"
import { walletConfigs } from './supportedWallets/walletConfig';
const starknetSigner = StarknetSigner;

export interface STRKTokenConfig extends TokenConfig {
  contractAddress: string;
  privateKey: string;
  address: string;
}

export default class BaseSTRK20Token extends BaseNodeToken {
  protected contractInstance!: Contract;
  protected contractAddress: string;
  protected declare providerInstance: Provider;
  protected privateKey: string;
  protected signer: StarknetSigner;
  protected account: Account;
  constructor(config: STRKTokenConfig) {
    super(config);
    this.contractAddress = config.contractAddress;
    this.privateKey = config.privateKey;
    this._address = config.address;
    this.providerInstance = new RpcProvider({ nodeUrl: this.providerUrl });
    this.account = new Account(this.providerInstance,this._address, this.privateKey);
    this.signer = new StarknetSigner(this.providerInstance,this._address,this.privateKey);
  }

  async init(): Promise<void> {
    try {
      await this.signer.init(); 
    } catch (error) {
      console.error('Failed to initialize signer:', error);
      throw error;
    }
  }

// Set the base token for gas payments based on the token address provided in the setup.
// Starknet supports two tokens for gas payments: ETH and STRK, both implemented as ERC20 tokens.
// Since these tokens have the same contract address on both mainnet and testnet, 
// we use the provided address directly to determine the base token for gas.
  async getContract(): Promise<Contract> {
    if (!this.contractInstance) {
      this.contractInstance = new Contract(
        strkerc20token,
        this.contractAddress,
        this.providerInstance
      );
      const decimals = Math.pow(10, await this.contractInstance.decimals());
      this.base =
        this.contractAddress ===
        '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'
          ? ['fri', decimals]
          : this.contractAddress ===
              '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
            ? ['wei', decimals]
            : ['', 0];
    }
    return this.contractInstance;
  }
  protected async getProvider(): Promise<RpcProvider> {
    if (!this.providerInstance) {
      this.providerInstance = new RpcProvider({ nodeUrl: this.providerUrl });
    }
    return this.providerInstance;
  }

  async getTx(txId: string): Promise<Tx> {
    try {
      const receipt = await this.providerInstance.getTransactionReceipt(txId);
      const traces = await this.providerInstance.getTransactionTrace(txId);
      
      if (!receipt || !traces) {
        throw new Error("Transaction does not exist or is still pending.");
      }
  
      const receiptResponse = (receipt as unknown as Transaction).value;
      const tracesResponse = (traces as FeeTransferInvocation).fee_transfer_invocation;
  
      const amount = receiptResponse?.actual_fee.amount;
  
      return {
        from: tracesResponse?.caller_address as string,
        to: tracesResponse?.contract_address as string,
        blockHeight: new BigNumber(receiptResponse?.block_number as number),
        amount: new BigNumber(amount as string),
        pending: !receiptResponse?.block_number,
        confirmed: !!(receiptResponse?.finality_status === 'ACCEPTED_ON_L1'),
      };
    } catch (error) {
      console.error(`Error fetching transaction details: ${error}`);
      throw error; 
    }
  }
  

  async ownerToAddress(_owner: any): Promise<string> {
    // Public key and address lengths
    const publicKeyLength = 33;
    const addressLength = 32;
  
    // Get the returned public key and convert to a buffer
    const returnedPubKey = await this.getAccountPublicKey();
    const returnedPubKeyBuffer = Buffer.from(returnedPubKey.toString());
  
    // Get the injected public key from the signer
    const InjectedPublicKey = this.signer.publicKey;
  
    // Extracting the public key and address from the InjectedPublicKey
    const extractedPublicKeyBuffer = InjectedPublicKey.subarray(0, publicKeyLength);
    const extractedAddressBuffer = InjectedPublicKey.subarray(publicKeyLength, publicKeyLength + addressLength);
  
    // Convert extracted buffers to hex
    const extractedAddressHex = extractedAddressBuffer.toString('hex');
  
    // Check if the returned public key matches the extracted public key
    if (returnedPubKeyBuffer.equals(extractedPublicKeyBuffer)) {
      return extractedAddressHex; 
    } else {
      return ""; 
    }
  }
  


  async getAccountPublicKey(): Promise<Result> {
    if (!this._address) {
      throw new Error('Address is not defined');
    }
  
    for (const config of walletConfigs) {
      try {
        const contractInstance = new Contract(config.abi, this._address, this.providerInstance);
        const publicKey = await contractInstance.call(config.selector);
        if (publicKey) {
          return publicKey;
        }
      } catch (error) {
        console.log(`${config.name} method failed.`);
      }
    }
  
    throw new Error(`Unable to retrieve the public key for address ${this._address}`);
  }
  

  async sign(data: Uint8Array): Promise<Uint8Array> {
    return this.signer.sign(data);
  }

  getSigner(): Signer {
    return this.signer;
  }

  verify(pub: any, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    return starknetSigner.verify(pub, data, signature);
  }

  async getCurrentHeight(): Promise<BigNumber> {
    const response = await this.providerInstance.getBlockNumber();
    return new BigNumber(response, 16);
  }

  async getFee(
    amount: BigNumber.Value,
    to?: string,
    _multiplier?: BigNumber.Value | undefined
  ): Promise<BigNumber> {
    try {
      const amountBigNumber = new BigNumber(amount);
      const _amount = uint256.bnToUint256(amountBigNumber.toString());
  
      const suggestedMaxFee = await this.account.estimateInvokeFee({
        contractAddress: this.contractAddress,
        entrypoint: 'transfer',
        calldata: [to || '', _amount.high, _amount.low],
      });
  
      const result = suggestedMaxFee.suggestedMaxFee;
      const result_to_hex = num.toHex(result);
      return new BigNumber(result_to_hex);
    } catch (error) {
      console.error('Error estimating fee:', error);
      throw new Error('Failed to estimate fee. Please try again.'); 
    }
  }
  

  async createTx(
    amount: BigNumber.Value,
    to: string,
    _fee?: string | object | undefined
  ): Promise<{ txId: string | undefined; tx: any }> {
    try {
      const amountBigNumber = new BigNumber(amount);
      const _amount = uint256.bnToUint256(amountBigNumber.toString());
  
      const calldata = [to, _amount.low, _amount.high];
      const maxFeeEstimate = await this.account.estimateFee({
        contractAddress: this.contractAddress,
        entrypoint: 'transfer',
        calldata,
      });
  
      const { transaction_hash: txId } = await this.account.execute(
        {
          contractAddress: this.contractAddress,
          entrypoint: 'transfer',
          calldata,
        },
        { maxFee: maxFeeEstimate.suggestedMaxFee }
      );
  
      return { txId, tx: txId };
    } catch (error) {
      console.error('Transaction creation failed:', error);
      throw new Error('Transaction failed. Please try again.');
    }
  }
  
  async sendTx(data: any): Promise<string | undefined> {
    if (!this._address) {
      throw new Error('Address is not defined');
    }
    try {
      // Execute the transaction using the account's invoke method
      const response = await this.account.execute(data);
      // Wait for the transaction to be confirmed
      await this.providerInstance.waitForTransaction(response.transaction_hash);
      return response.transaction_hash;
    } catch (error) {
      console.error(`Error occurred while sending transaction - ${error}`);
      throw error;
    }
  }

  getPublicKey(): string | Buffer {
    return this.signer.publicKey;
  }
}

interface FeeTransferInvocation {
  fee_transfer_invocation?: {
    calldata: string[];
    caller_address: string;
    contract_address: string;
    entry_point_selector: string;
    entry_point_type: string;
  };
}

interface Transaction {
  value?: {
    actual_fee: {
      amount: string;
      unit: 'WEI';
    };
    block_number: number;
    execution_status: 'SUCCEEDED' | 'FAILED';
    finality_status: 'ACCEPTED_ON_L1' | 'REJECTED';
  };
}

