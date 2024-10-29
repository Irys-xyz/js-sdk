import { BaseNodeToken } from '@irys/upload/tokens/base';
import type { TokenConfig, Tx } from '@irys/upload-core';
import { Contract, RpcProvider, Provider } from 'starknet';
import { StarknetSigner, Signer } from '@irys/bundles';
import BigNumber from 'bignumber.js';
import { num, Account, uint256 } from 'starknet';

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
  
  ownerToAddress(owner: any): string {
    return this.signer.address;
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

const strkerc20token = [
  {
    members: [
      {
        name: 'low',
        offset: 0,
        type: 'felt',
      },
      {
        name: 'high',
        offset: 1,
        type: 'felt',
      },
    ],
    name: 'Uint256',
    size: 2,
    type: 'struct',
  },
  {
    data: [
      {
        name: 'from_',
        type: 'felt',
      },
      {
        name: 'to',
        type: 'felt',
      },
      {
        name: 'value',
        type: 'Uint256',
      },
    ],
    keys: [],
    name: 'Transfer',
    type: 'event',
  },
  {
    data: [
      {
        name: 'owner',
        type: 'felt',
      },
      {
        name: 'spender',
        type: 'felt',
      },
      {
        name: 'value',
        type: 'Uint256',
      },
    ],
    keys: [],
    name: 'Approval',
    type: 'event',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: 'name',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: 'symbol',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        name: 'totalSupply',
        type: 'Uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: 'decimals',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'account',
        type: 'felt',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'Uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'owner',
        type: 'felt',
      },
      {
        name: 'spender',
        type: 'felt',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        name: 'remaining',
        type: 'Uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'permittedMinter',
    outputs: [
      {
        name: 'minter',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'initialized',
    outputs: [
      {
        name: 'res',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'get_version',
    outputs: [
      {
        name: 'version',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'get_identity',
    outputs: [
      {
        name: 'identity',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'init_vector_len',
        type: 'felt',
      },
      {
        name: 'init_vector',
        type: 'felt*',
      },
    ],
    name: 'initialize',
    outputs: [],
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'recipient',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        name: 'success',
        type: 'felt',
      },
    ],
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'sender',
        type: 'felt',
      },
      {
        name: 'recipient',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [
      {
        name: 'success',
        type: 'felt',
      },
    ],
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'spender',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        name: 'success',
        type: 'felt',
      },
    ],
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'spender',
        type: 'felt',
      },
      {
        name: 'added_value',
        type: 'Uint256',
      },
    ],
    name: 'increaseAllowance',
    outputs: [
      {
        name: 'success',
        type: 'felt',
      },
    ],
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'spender',
        type: 'felt',
      },
      {
        name: 'subtracted_value',
        type: 'Uint256',
      },
    ],
    name: 'decreaseAllowance',
    outputs: [
      {
        name: 'success',
        type: 'felt',
      },
    ],
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'recipient',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
    ],
    name: 'permissionedMint',
    outputs: [],
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'account',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
    ],
    name: 'permissionedBurn',
    outputs: [],
    type: 'function',
  },
];
