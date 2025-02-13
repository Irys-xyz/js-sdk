import type EthereumConfig from '@irys/web-upload-ethereum/ethereum';
import { getV2Adapter } from './adapter';
import { type Adapter } from '@irys/web-upload/builder';
import type { PublicClient } from 'viem';

export function ViemV2Adapter(
  provider: any,
  opts: { publicClient: PublicClient; accountIndex?: number }
): Adapter {
  return {
    phase: 'pre',
    adaptTokenPre(builder, tokenConfig) {
      builder.withProvider(provider);
      // todo: add validation here
      builder.token = getV2Adapter(
        tokenConfig as { new (...args: any): EthereumConfig },
        // @ts-expect-error types
        opts
      );
    },
  };
}
