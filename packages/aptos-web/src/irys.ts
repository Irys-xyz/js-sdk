import { Network } from '@aptos-labs/ts-sdk';
import BaseAptosToken from './token';
import {
  ConstructableWebToken,
  type TokenConfigTrimmed,
} from '@irys/web-upload/builder';

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

// export function AptosBundlerWebIrys() {
//     return new Builder(AptosToken)/* .withTokenOptions(opts) */
// }
// export default AptosBundlerWebIrys

export const WebAptos: ConstructableWebToken = AptosToken;
export default WebAptos;
