import type { TokenConfig, Tx } from '@irys/upload-core';
import { BaseNodeToken } from '@irys/upload/tokens/base';
import { Contract, RpcProvider, Provider } from 'starknet';
import { StarknetSigner, Signer, byteArrayToLong } from '@irys/bundles';
import BigNumber from 'bignumber.js';
import { num, Account, uint256 } from 'starknet';
import strkerc20token from './erc20.abi.json';
import { KnownAccountContracts } from './walletConfig';

const starknetSigner = StarknetSigner;

export interface STRKTokenConfig extends TokenConfig {
  contractAddress: string;
  contractBase: [string, number | undefined];
  address: string;
}

export function extractX(bytes: Buffer): string {
  const hex = bytes.subarray(1).toString("hex");
  const stripped = hex.replace(/^0+/gm, ''); // strip leading 0s
  return `0x${stripped}`;
}

export function decomposePubkey(pubkey: Buffer): [Buffer, Buffer, Buffer] {
  return [pubkey.subarray(0, 33), pubkey.subarray(33, -2), pubkey.subarray(-2)];
}

export const felt2hex = (felt: any) => "0x" + BigInt(felt).toString(16).padStart(64, '0');

const TRANSFER_KEY = "0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9"


// "stark" public keys truncate some bytes... (but these truncated pubkeys can't be used for signature validation..)
// so we need to perform this truncation in order to validate if two public keys are "equivalent"
function validateStarkFullPubKey(fullPubKey: Buffer, starkPubKey: Buffer): boolean {
  try {
    const trimmedFullPubKey = extractX(fullPubKey);
    const trimmedFullPubKeyBin = Buffer.from(trimmedFullPubKey.slice(2), "hex");
    return Buffer.compare(trimmedFullPubKeyBin, starkPubKey) == 0;
  }
  catch (_) { return false; }
}

export default class BaseSTRK20Token extends BaseNodeToken {
  protected contractInstance!: Contract;
  protected contractAddress: string;
  protected declare providerInstance: Provider;
  protected signer?: StarknetSigner;
  protected account: Account;
  protected config: STRKTokenConfig;

  constructor(config: STRKTokenConfig) {
    // TODO: fix this hack (remove use of Object.assign)
    const address = config.address;
    const wallet = config.wallet;
    // @ts-ignore
    delete config.address;
    delete config.wallet;

    super(config);
    this.wallet = wallet;
    this.config = config;
    this.contractAddress = config.contractAddress;
    this._address = address.toLowerCase();
    this.providerInstance = new RpcProvider({ nodeUrl: this.providerUrl });
    this.account = new Account(
      this.providerInstance,
      this._address,
      this.wallet,
      undefined, "0x3" // use version 3 so the gas token is $STRK
    );

  }

  async ready(): Promise<void> {
    await this.getContract();
    const { publicKey, id } = await this.getAccountCompactPublicKey(this._address!!);

    this.signer = new StarknetSigner(
      this.providerInstance,
      this._address!!,
      this.wallet,
      id
    );

    await this.signer.init();
    // this is a good early catch for if the wrong address has been provided
    if (!validateStarkFullPubKey(this.signer.publicKey.subarray(0, 33), publicKey)) throw new Error("Account contract and private key derived public keys do not match! check you private key/address?");
    const address = await this.ownerToAddress(this.signer.publicKey);
    if (address !== this._address!!) throw new Error("Failed address self check, check your private key/address?");
  }

  // Set the base token for gas payments based on the token address provided in the setup.
  // Starknet supports two tokens for gas payments: ETH and STRK, both implemented as ERC20 tokens.
  // Since these tokens have the same contract address on both mainnet and testnet,
  // we use the provided address directly to determine the base token for gas.
  // @notice: STRK AND ETH TOKEN HAVE THE SAME ADDRESS ON MAINNET AND TESTNET
  // STARK TOKEN ON MAINNET : https://starkscan.co/token/0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
  // ETH TOKEN ON MAINNET: https://sepolia.starkscan.co/token/0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
  async getContract(): Promise<Contract> {
    if (!this.contractInstance) {
      this.contractInstance = new Contract(
        strkerc20token,
        this.contractAddress,
        this.providerInstance
      );
      const configBase = this.config.contractBase;
      this.base = typeof configBase[1] === "number" ? configBase as [string, number] : [configBase[0], Math.pow(10, await this.contractInstance.decimals())];

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
      const receipt = await this.providerInstance.getTransactionReceipt(txId);
      const traces = await this.providerInstance.getTransactionTrace(txId);

      if (!receipt || !traces) {
        throw new Error('Transaction does not exist or is still pending.');
      }

      const receiptResponse = (receipt as unknown as Transaction).value;
      const tracesResponse = (traces as FeeTransferInvocation)
        .fee_transfer_invocation;

      if(receiptResponse?.execution_status !== "SUCCEEDED") throw new Error("Transaction failed")

      const transferEvent = receiptResponse.events.find(event => 
        event.keys.includes(TRANSFER_KEY) && felt2hex(event.from_address) == this.contractAddress
      );

      if(!transferEvent) throw new Error(`No transfer event found for contract ${this.contractAddress}`)
      
      const to = felt2hex(transferEvent.data[1]);
      const amount = BigInt(transferEvent.data[2]);;
      const from = felt2hex(tracesResponse?.caller_address)
      
      return {
        from: from,
        to: to,
        blockHeight:  (receiptResponse?.block_number) ? new BigNumber(receiptResponse?.block_number) : undefined,
        amount: new BigNumber(amount.toString()),
        pending: !receiptResponse?.block_number,
        confirmed: !!(['ACCEPTED_ON_L1', 'ACCEPTED_ON_L2'].includes(receiptResponse?.finality_status as string) ),
      };
  }

  async ownerToAddress(owner: any): Promise<string> {

    // extract elements
    const [pubKey, addressBuf, contractIdBuf] = decomposePubkey(owner as Buffer);
    const contractId = byteArrayToLong(contractIdBuf);
    const address = "0x" + addressBuf.toString("hex");
    // check the public key we can get from the contract
    const { publicKey: starkPubKey } = await this.getAccountCompactPublicKey(address, contractId);
    if (!validateStarkFullPubKey(pubKey, starkPubKey)) throw new Error(`Incorrect public key ${pubKey} for address ${address}`);

    return address;
  }

  public async getAccountCompactPublicKey(address: string, contractId?: number): Promise<{ publicKey: Buffer, id: number; }> {
    if (contractId) {
      const config = KnownAccountContracts.get(contractId);
      if (config) {
        const contractInstance = new Contract(
          config.abi,
          address,
          this.providerInstance
        );
        const publicKey = await contractInstance.call(config.selector, undefined, { parseResponse: false }).catch(_ => false)
        if (publicKey) {
          return { publicKey: config.postProcessor(publicKey), id: contractId };
        }
      }
    }
    // fallthrough to check every known contract
    for (const [id, config] of KnownAccountContracts.entries()) {
        const contractInstance = new Contract(
          config.abi,
          address,
          this.providerInstance
        );
        const publicKey = await contractInstance.call(config.selector, undefined, { parseResponse: false }) .catch(_ => false)
        if (publicKey) {
          return { publicKey: config.postProcessor(publicKey), id };
        }
    }

    throw new Error(
      `Unable to retrieve the public key for address ${address} - does this address have a deployed account contract?`
    );
  }

  async sign(data: Uint8Array): Promise<Uint8Array> {
    return this.getSigner().sign(data);
  }

  getSigner(): Signer {
    if (!this.signer) throw new Error("Token has not been fully initialized - please run .ready()");
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
      const amountBigNumber = new BigNumber(amount);
      const _amount = uint256.bnToUint256(amountBigNumber.toString());

      const maxFeeEstimate = await this.account.estimateFee({
        contractAddress: this.contractAddress,
        entrypoint: 'transfer',
        calldata: [to || '',_amount.low, _amount.high],
      });

      const result = maxFeeEstimate.suggestedMaxFee;
      const result_to_hex = num.toHex(result);
      return new BigNumber(result_to_hex);
  }


  async createTx(
    amount: BigNumber.Value,
    to: string,
    fee?: string | object | undefined
  ): Promise<{ txId: string | undefined; tx: any; }> {
    const amountBigNumber = new BigNumber(amount);
    const _amount = uint256.bnToUint256(amountBigNumber.toString());

    const calldata = [to, _amount.low, _amount.high];

    return {
      txId: undefined, tx: {
        call: {
          contractAddress: this.contractAddress,
          entrypoint: 'transfer',
          calldata,
        },
        args: { maxFee: fee}
      }
    };

  }

  async sendTx(data: any): Promise<string | undefined> {
    const { call, args } = data;
    // Execute the transaction using the account's invoke method
    const { transaction_hash: txId } = await this.account.execute(call, args);
    // Wait for the transaction to be confirmed
    await this.providerInstance.waitForTransaction(txId);
    return txId;
  }

  getPublicKey(): string | Buffer {
    return this.getSigner().publicKey;
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
    finality_status: 'ACCEPTED_ON_L1' | 'ACCEPTED_ON_L2' | 'REJECTED';
    events: any[]
  };
}
