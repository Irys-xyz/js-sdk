import BigNumber from 'bignumber.js';
import type { TokenConfig, Tx } from '@irys/upload-core';
import retry from 'async-retry';
import type { Finality, ParsedInstruction } from '@solana/web3.js';
import { ComputeBudgetProgram, PublicKey, Transaction } from '@solana/web3.js';
import SolanaConfig from './token';
//@ts-ignore spl-token has type: module set in it's package.json, which means it's CJS export won't be detected/built :c
import { createTransferInstruction, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"; // assert { "resolution-mode": "node" }

export type GetFeeResult = {
  computeBudget: BigNumber;
  computeUnitPrice: BigNumber;
};

export type SPLTokenConfig = TokenConfig<
  any,
  { finality?: Finality; disablePriorityFees?: boolean }
> & { contractAddress: string };

export class SPLConfig extends SolanaConfig {
  protected contractAddress!: string;
  protected decimals!: number;

  constructor(config: SPLTokenConfig) {
    super(config);
  }

  async getSPLMetadata() {
    const meta = await (
      await this.getProvider()
    ).getParsedAccountInfo(new PublicKey(this.contractAddress));
    const metaData = meta?.value?.data;
    if (!metaData || Buffer.isBuffer(metaData))
      throw new Error(
        `Failed to get valid SPL metadata for ${this.contractAddress}`
      );
    if (metaData.program !== 'spl-token')
      throw new Error(
        `Invalid program type, expected 'spl-token', got ${metaData.program}`
      );
    const parsedInfo = metaData.parsed.info;
    const decimals = parsedInfo.decimals;
    const atomicPer = 10 ** decimals;
    if (!isFinite(atomicPer) || !atomicPer.toString().endsWith('0'))
      throw new Error(
        `Unable to compute sane atomic unit count for ${decimals}, got ${atomicPer}`
      );
    this.decimals = decimals;
    this.base[1] = atomicPer;
  }

  async getTx(txId: string): Promise<Tx> {
    const connection = await this.getProvider();

    const stx = await connection.getParsedTransaction(txId, {
      commitment: this.finality,
      maxSupportedTransactionVersion: 0,
    });
    console.log(stx);
    if (!stx) throw new Error('Confirmed tx not found');

    const transfer = stx.transaction.message.instructions.find((op) => {
      op = op as ParsedInstruction;
      return (
        op.program === 'spl-token' &&
        ['transfer', 'transferChecked'].includes(op.parsed.type)
        //   && [op.parsed.info.destination, op.parsed.info.source].includes(this.address)
      );
    }) as ParsedInstruction;

    if (!transfer)
      throw new Error(`Tx does not contain a valid transfer instruction`);
    if (!transfer.parsed?.info)
      throw new Error(
        `tx ${txId} Missing required parsed metadata (transfer instruction info)`
      );

    const { source, destination, amount } = transfer.parsed.info;
    if (!(source && destination && amount))
      throw new Error(
        `tx ${txId} Missing required parsed metadata (transfer instruction source, destination, or amount)`
      );

    const getAndValidateTokenAccOwner = async (
      tokenAccAddress: string
    ): Promise<string> => {
      const tokenAccInfo = await connection.getParsedAccountInfo(
        new PublicKey(tokenAccAddress)
      );
      const tokenAccInfoValue = tokenAccInfo.value;
      if (
        !tokenAccInfoValue ||
        Buffer.isBuffer(tokenAccInfoValue) ||
        Buffer.isBuffer(tokenAccInfoValue.data)
      )
        throw new Error(
          `tx ${txId} contains an unknown token account ${source}`
        );
      const tokenAccInfoParsedOwner = tokenAccInfoValue.data.parsed.info.owner;
      if (!tokenAccInfoParsedOwner)
        throw new Error(
          `unable to resolve address for token account ${destination}`
        );
      return tokenAccInfoParsedOwner;
    };
    const actualSourceAddress = await getAndValidateTokenAccOwner(source);
    const actualDestinationAddress =
      await getAndValidateTokenAccOwner(destination);
    const currentSlot = await connection.getSlot(this.finality);
    if (!stx.meta) throw new Error(`Unable to resolve transaction ${txId}`);

    const tx: Tx = {
      from: actualSourceAddress,
      to: actualDestinationAddress,
      amount: new BigNumber(amount),
      blockHeight: new BigNumber(stx.slot),
      pending: false,
      confirmed: currentSlot - stx.slot >= 1,
    };
    return tx;
  }

  async _createTxUnsigned(
    amount: BigNumber.Value,
    to: string,
    fee?: GetFeeResult
  ): Promise<Transaction> {
    const keys = this.getKeyPair();
    const connection = await this.getProvider();
    const blockHashInfo = await retry(
      async (bail) => {
        try {
          return await connection.getLatestBlockhash(this.finality);
        } catch (e: any) {
          if (e.message?.includes('blockhash')) throw e;
          else bail(e);
          throw new Error('Unreachable');
        }
      },
      { retries: 3, minTimeout: 1000 }
    );

    const transaction = new Transaction({
      ...blockHashInfo,
      feePayer: keys.publicKey,
    });
    const mint = new PublicKey(this.contractAddress);
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keys,
      mint,
      keys.publicKey
    );
    const toTokenAccount = await getAssociatedTokenAddress(
      mint,
      new PublicKey(to)
    );

    transaction.add(
      createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount,
        keys.publicKey,
        +new BigNumber(amount).toNumber()
      )
    );
    if (!this?.config?.opts?.disablePriorityFees && fee) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: fee.computeUnitPrice.toNumber(),
        })
      );
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: fee.computeBudget.toNumber(),
        })
      );
    }
    return transaction;
  }

  async ready() {
    // await super.ready()
    await this.getSPLMetadata();
  }
}
export default SPLConfig;
