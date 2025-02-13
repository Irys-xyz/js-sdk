import { Network } from '@aptos-labs/ts-sdk';
import BaseAptosToken from './token';
import { Constructable, type TokenConfigTrimmed } from '@irys/upload/builder';
import { BaseNodeToken } from '@irys/upload/esm/tokens/base';

export class AptosToken extends BaseAptosToken {
  constructor(config: TokenConfigTrimmed) {
    super({
      name: 'aptos',
      ticker: 'APT',
      ...config,
      providerUrl: config.providerUrl ?? Network.MAINNET,
    });
  }
}

// export function AptosBundlerIrys() {
//     return new Builder(AptosToken)/* .withTokenOptions(opts) */
// }
// export default AptosBundlerIrys

export const Aptos: Constructable<[TokenConfigTrimmed], BaseNodeToken> =
  AptosToken;
export default Aptos;
