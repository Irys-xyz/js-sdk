import BaseSolanaToken from './token';
import { Constructable, type TokenConfigTrimmed } from '@irys/upload';
import { BaseNodeToken } from '@irys/upload/tokens/base';
import BaseSPLToken from './spl';

export class SolanaToken extends BaseSolanaToken {
  constructor(config: TokenConfigTrimmed) {
    super({
      name: 'solana',
      ticker: 'SOL',
      ...config,
      providerUrl: config.providerUrl ?? 'https://api.mainnet-beta.solana.com/',
    });
  }
}

function getBoundSolana({
  name,
  ticker,
  providerUrl,
}: {
  name: string;
  ticker: string;
  providerUrl: string;
}) {
  return class SolanaToken extends BaseSolanaToken {
    constructor(config: TokenConfigTrimmed) {
      super({
        name,
        ticker,
        ...config,
        providerUrl: config.providerUrl ?? providerUrl,
      });
    }
  };
}

// export function SolanaBundlerIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
//     // return a builder
//     return new Builder(SolanaToken).withTokenOptions(opts)
// }
// export default SolanaBundlerIrys

// export function EclipseBundlerIrys(opts?:  { finality?: Finality; disablePriorityFees?: boolean } ) {
//     return new Builder(getBoundSolana({name: "eclipse", ticker: "ETH", providerUrl:  "https://mainnetbeta-rpc.eclipse.xyz"}))
//     .withTokenOptions(opts)
// }

export const Solana: Constructable<[TokenConfigTrimmed], BaseNodeToken> =
  SolanaToken;
export default Solana;

export const EclipseEth: Constructable<[TokenConfigTrimmed], BaseNodeToken> =
  getBoundSolana({
    name: 'eclipse-eth',
    ticker: 'ETH',
    providerUrl: 'https://mainnetbeta-rpc.eclipse.xyz',
  });

function getBoundSPL({
  name,
  ticker,
  providerUrl,
  contractAddress,
}: {
  name: string;
  ticker: string;
  providerUrl: string;
  contractAddress: string;
}) {
  return class SPLToken extends BaseSPLToken {
    constructor(config: TokenConfigTrimmed) {
      super({
        name,
        ticker,
        ...config,
        providerUrl: config.providerUrl ?? providerUrl,
        contractAddress: config?.opts?.contractAddress ?? contractAddress,
      });
    }
  };
}

export const USDCSolana: Constructable<[TokenConfigTrimmed], BaseNodeToken> =
  getBoundSPL({
    name: 'usdc-solana',
    ticker: 'USDC',
    providerUrl: 'https://api.mainnet-beta.solana.com/',
    contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  });
