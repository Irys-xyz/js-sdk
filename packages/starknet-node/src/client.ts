import { BaseNodeToken } from "@irys/upload/tokens/base";
import { Constructable, type TokenConfigTrimmed } from "@irys/upload/builder";
import BaseSTRK20Token from "./token";


const STARKNET_PROVIDER_URL = "https://starknet-mainnet.public.blastapi.io";
const CONTRACT_ADDRESSES = {
    ETH: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    STRK: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
};

// set stark token as default
export class StarknetToken extends BaseSTRK20Token {
    constructor(config: TokenConfigTrimmed) {
        super({
            name: "starknet",
            ticker: "STRK",
            ...config,
            contractAddress: config.opts?.contractAddress ?? CONTRACT_ADDRESSES.STRK,
            privateKey: config.opts?.privateKey ?? "",
            address: config.opts?.address ?? "",
            providerUrl: config.providerUrl ?? STARKNET_PROVIDER_URL
        });
    }
}

function getBoundERC20(name: string, ticker: string, contractAddress: string): Constructable<[TokenConfigTrimmed], BaseSTRK20Token> {
    return class extends BaseSTRK20Token {
        constructor(config: TokenConfigTrimmed) {
            super({
                name,
                ticker,
                ...config,
                providerUrl: config.providerUrl ?? STARKNET_PROVIDER_URL,
                contractAddress: config.opts?.contractAddress ?? contractAddress,
                privateKey: config.opts?.privateKey ?? "",
                address: config.opts?.address ?? ""
            });
        }
    };
}

// config to use starknetETH
export const StarknetEth = getBoundERC20("eth", "ETH", CONTRACT_ADDRESSES.ETH);
export const Starknet: Constructable<[TokenConfigTrimmed], BaseNodeToken> = StarknetToken

export default Starknet;
