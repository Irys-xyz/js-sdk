import BigNumber from "bignumber.js";
import { Contract } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";
import { keccak256 } from "@irys/bundles";
import { getRedstonePrice } from "@irys/upload/tokens/base";
import EthereumConfig from "./ethereum";
import type { TokenConfig, Tx } from "@irys/upload-core";
export interface ERC20TokenConfig extends TokenConfig {
  contractAddress: string;
}

export class BaseERC20Token extends EthereumConfig {
  private contractInstance!: Contract;
  private contractAddress: string;

  constructor(config: ERC20TokenConfig) {
    super(config);
    this.contractAddress = config.contractAddress;
  }

  async getContract(): Promise<Contract> {
    if (!this.contractInstance) {
      this.contractInstance = new Contract(this.contractAddress, erc20abi, new Wallet(this.wallet, await this.getProvider()));
      this.base = ["wei", Math.pow(10, await this.contractInstance.decimals())];
    }
    return this.contractInstance;
  }

  async getTx(txId: string): Promise<Tx> {
    const response = await (await super.getProvider()).getTransaction(txId);
    if (!response) throw new Error("Tx doesn't exist");
    if (
      response.data.length !== 138 ||
      response.data.slice(2, 10) !== "a9059cbb" // standard ERC20-ABI method ID for transfers
    ) {
      throw new Error("Tx isn't a ERC20 transfer");
    }
    const to = `0x${response.data.slice(34, 74)}`;
    const amount = new BigNumber(response.data.slice(74), 16);

    return {
      from: response.from,
      to,
      blockHeight: response.blockNumber ? new BigNumber(response.blockNumber) : undefined,
      amount,
      pending: response.blockNumber ? false : true,
      confirmed: response.confirmations >= this.minConfirm,
    };
  }

  async getFee(amount: BigNumber.Value, to?: string): Promise<BigNumber> {
    const _amount = "0x" + new BigNumber(amount).toString(16);
    const contract = await this.getContract();

    const provider = await this.getProvider();
    const gasPrice = await provider.getGasPrice();
    const gasLimit = await contract.estimateGas.transfer(to, _amount);
    const units = new BigNumber(gasPrice.mul(gasLimit).toString()); // price in WEI

    return units;
    // below is cost in contract token units for the gas price
    // const [fiatGasPrice] = await this.getGas(); // get price of gas units
    // const value = fiatGasPrice.multipliedBy(units); // value of the fee
    // // convert value
    // const ctPrice = new BigNumber(await this.price()); // price for this token

    // const ctAmount = new BigNumber(value).dividedToIntegerBy(ctPrice);
    // // const b = ctAmount.multipliedBy(ctPrice)
    // // const c = value.dividedBy(this.base[1])
    // // console.log(b);
    // // console.log(c)
    // return ctAmount;
  }

  async createTx(amount: BigNumber.Value, to: string, _fee?: string): Promise<{ txId: string | undefined; tx: any }> {
    const provider = await this.getProvider();
    const wallet = new Wallet(this.wallet, provider);
    const contract = await this.getContract();
    const _amount = "0x" + new BigNumber(amount).toString(16);
    const tx = await contract.populateTransaction.transfer(to, _amount);
    // Needed *specifically* for ERC20
    tx.gasPrice = await provider.getGasPrice();
    tx.gasLimit = await contract.estimateGas.transfer(to, _amount);
    tx.chainId = (await provider.getNetwork()).chainId;
    if (!this.address) throw new Error("Address is undefined - you might be missing a wallet, or have not run Irys.ready()");
    tx.nonce = await provider.getTransactionCount(this.address);
    const signedTx = await wallet.signTransaction(tx);
    const txId = "0x" + keccak256(Buffer.from(signedTx.slice(2), "hex")).toString("hex");
    return { txId, tx: signedTx };
  }

  // TODO: create a nicer solution than just overrides (larger issue: some currencies aren't on redstone)
  public async getGas(): Promise<[BigNumber, number]> {
    return [new BigNumber(await getRedstonePrice("ETH")), 1e18];
  }
}

export default BaseERC20Token

export const erc20abi = [
    {
      constant: true,
      inputs: [],
      name: "name",
      outputs: [
        {
          name: "",
          type: "string",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        {
          name: "_spender",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "totalSupply",
      outputs: [
        {
          name: "",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        {
          name: "_from",
          type: "address",
        },
        {
          name: "_to",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [
        {
          name: "",
          type: "uint8",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        {
          name: "_owner",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          name: "balance",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "symbol",
      outputs: [
        {
          name: "",
          type: "string",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        {
          name: "_to",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        {
          name: "_owner",
          type: "address",
        },
        {
          name: "_spender",
          type: "address",
        },
      ],
      name: "allowance",
      outputs: [
        {
          name: "",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      payable: true,
      stateMutability: "payable",
      type: "fallback",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
  ];
  