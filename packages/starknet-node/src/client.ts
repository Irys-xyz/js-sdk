import { BaseNodeToken } from "@irys/upload/tokens/base";
import { Constructable, type TokenConfigTrimmed } from "@irys/upload/builder";
import BaseSTRK20Token from "./token";


const STARKNET_PROVIDER_URL = "https://starknet-mainnet.public.blastapi.io";
const KNOWN_CONTRACTS: {[key: string] :{address: string, base: [string, number]}} = {
    ETH: {address:"0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", base: ["wei", 10 ** 18]},
    STRK: {address:"0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", base: ["fri", 10 ** 18]},
};


// set stark token as default


// function getBoundERC20(name: string, ticker: string, contractAddress: string, contractBase: STRKTokenConfig["contractBase"]) {
//     // address is a required parameter, as we can't derive it from the private key
//     const a = (address: string): Constructable<[TokenConfigTrimmed], BaseSTRK20Token> => {
//         return class extends BaseSTRK20Token {
//             constructor(config: TokenConfigTrimmed) {
//                 super({
//                     name,
//                     ticker,
//                     ...config,
//                     providerUrl: config.providerUrl ?? STARKNET_PROVIDER_URL,
//                     contractAddress: config.opts?.contractAddress ?? contractAddress,
//                     address,
//                     contractBase
//                 });
//             }
//         };
//     }
//     return a
// }



// // config to use starknetETH
// export const StarknetEth = getBoundERC20("starknet-eth", "ETH", KNOWN_CONTRACTS.ETH.address, KNOWN_CONTRACTS.ETH.base);

export const Starknet = (address: string):  Constructable<[TokenConfigTrimmed], BaseNodeToken> => {
    return class StarknetToken extends BaseSTRK20Token {
        constructor(config: TokenConfigTrimmed) {
            super({
                name: "starknet",
                ticker: "STRK",
                ...config,
                contractAddress: config.opts?.contractAddress ?? KNOWN_CONTRACTS.STRK.address,
                address,
                providerUrl: config.providerUrl ?? STARKNET_PROVIDER_URL,
                contractBase: KNOWN_CONTRACTS.STRK.base
            });
        }
    }
}

export default Starknet;
