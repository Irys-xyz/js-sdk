import BaseWebToken from "@irys/web-upload/esm/tokens/base";
import BaseERC20Token from "./erc20";
import BaseEthereumToken from "./ethereum";
import { Constructable, type TokenConfigTrimmed} from "@irys/web-upload/builder"

 export class EthereumToken extends BaseEthereumToken {
    constructor(config: TokenConfigTrimmed) {
        super({name: "ethereum", ticker: "ETH",
           ...config,
           providerUrl: config.providerUrl ?? "https://cloudflare-eth.com/",
         })
    }
}

// todo: overhaul this
function getBoundEth({name, ticker, providerUrl}: {name: string, ticker: string, providerUrl: string}) {
    return class EthereumToken extends BaseEthereumToken {
        constructor(config: TokenConfigTrimmed) {
            super({name, ticker, 
               ...config,
               providerUrl: config.providerUrl ?? providerUrl,
             })
        }
    }
}

function getBoundERC20({name, ticker, providerUrl, contractAddress}: {name: string, ticker: string, providerUrl: string, contractAddress: string}) {
    return class ERC20Token extends BaseERC20Token {
        constructor(config: TokenConfigTrimmed) {
            super({name, ticker, 
               ...config,
               providerUrl: config.providerUrl ?? providerUrl,
                contractAddress: config.opts?.contractAddress ?? contractAddress,
             })
        }
    }
}

// export function MaticBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "matic", ticker: "MATIC", providerUrl: "https://polygon-rpc.com/" })).withTokenOptions(opts)
// }

export const WebMatic: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "matic", ticker: "MATIC", providerUrl: "https://polygon-rpc.com/" })

// export function BNBBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "bnb", ticker: "BNB", providerUrl: "https://bsc-dataseed.binance.org/" })).withTokenOptions(opts)
// }
export const WebBNB: Constructable<[TokenConfigTrimmed], BaseWebToken> =getBoundEth({name: "bnb", ticker: "BNB", providerUrl: "https://bsc-dataseed.binance.org/" })


// export function AvalancheBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "avalanche", ticker: "AVAX", providerUrl: "https://api.avax-test.network/ext/bc/C/rpc/" })).withTokenOptions(opts)
// }
export const WebAvalanche: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "avalanche", ticker: "AVAX", providerUrl: "https://api.avax-test.network/ext/bc/C/rpc/" })

// export function BaseEthBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "base-eth", ticker: "ETH", providerUrl: "https://mainnet.base.org/" })).withTokenOptions(opts)
// }
export const WebBaseEth: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "base-eth", ticker: "ETH", providerUrl: "https://mainnet.base.org/" })

// export function USDCEthBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundERC20({name: "usdc-eth", ticker: "USDC", providerUrl: "https://cloudflare-eth.com/", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" })).withTokenOptions(opts)
// }
export const WebUSDCEth: Constructable<[TokenConfigTrimmed], BaseERC20Token> = getBoundERC20({name: "usdc-eth", ticker: "USDC", providerUrl: "https://cloudflare-eth.com/", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" })

// export function ArbitrumBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "arbitrum", ticker: "ETH", providerUrl:"https://arb1.arbitrum.io/rpc/" })).withTokenOptions(opts)
// }
export const WebArbitrum: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "arbitrum", ticker: "ETH", providerUrl:"https://arb1.arbitrum.io/rpc/" })

// export function ChainlinkBundlerWebIrys(opts?: EthereumTokenOpts) {
    // return new Builder(getBoundERC20({name: "chainlink", ticker: "LINK", providerUrl: "https://main-light.eth.linkpool.io/", contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA" })).withTokenOptions(opts)
// }
export const WebChainlink: Constructable<[TokenConfigTrimmed], BaseERC20Token> = getBoundERC20({name: "chainlink", ticker: "LINK", providerUrl: "https://main-light.eth.linkpool.io/", contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA" })

// export function USDCPolygonBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundERC20({name: "usdc-polygon", ticker: "USDC", providerUrl:"https://polygon-rpc.com", contractAddress:"0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" })).withTokenOptions(opts)
// }
export const WebUSDCPolygon: Constructable<[TokenConfigTrimmed], BaseERC20Token> = getBoundERC20({name: "usdc-polygon", ticker: "USDC", providerUrl:"https://polygon-rpc.com", contractAddress:"0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" })

// export function BeraBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "bera", ticker: "BERA", providerUrl:"https://bartio.rpc.berachain.com/" })).withTokenOptions(opts)
// }
export const WebBera: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "bera", ticker: "BERA", providerUrl:"https://bartio.rpc.berachain.com/" })

// export function ScrollEthBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "scroll-eth", ticker: "ETH", providerUrl:"https://rpc.scroll.io" })).withTokenOptions(opts)
// }
export const WebScrollEth: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "scroll-eth", ticker: "ETH", providerUrl:"https://rpc.scroll.io" })

// export function LineaEthBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "linea-eth", ticker: "ETH", providerUrl:"https://rpc.linea.build" })).withTokenOptions(opts)
// }
export const WebLineaEth: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "linea-eth", ticker: "ETH", providerUrl:"https://rpc.linea.build" })

// export function IotexBundlerWebIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "iotex", ticker: "IOTX", providerUrl:"https://babel-api.mainnet.iotex.io/" })).withTokenOptions(opts)
// }
export const WebIotex: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "iotex", ticker: "IOTX", providerUrl:"https://babel-api.mainnet.iotex.io/" })

// export function EthereumBundlerWebIrys() {
//     // return a builder
//     return new Builder(EthereumToken)/* .withTokenOptions(opts) */
// }
// export const WebMatic: Constructable<[TokenConfigTrimmed], BaseWebToken> = getBoundEth({name: "matic", ticker: "MATIC", providerUrl: "https://polygon-rpc.com/" })
export const WebEthereum = EthereumToken
export default WebEthereum
