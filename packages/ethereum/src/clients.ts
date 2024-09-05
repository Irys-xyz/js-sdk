import BaseERC20Token from "./erc20";
import BaseEthereumToken from "./ethereum";
import { Constructable, type TokenConfigTrimmed} from "@irys/upload/builder"
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

// export function MaticBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(Matic).withTokenOptions(opts)
// }
export const Matic: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundEth({name: "matic", ticker: "MATIC", providerUrl: "https://polygon-rpc.com/" })

// export function BNBBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "bnb", ticker: "BNB", providerUrl: "https://bsc-dataseed.binance.org/" })).withTokenOptions(opts)
// }
export const BNB: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundEth({name: "bnb", ticker: "BNB", providerUrl: "https://bsc-dataseed.binance.org/" })


// export function AvalancheBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "avalanche", ticker: "AVAX", providerUrl: "https://api.avax-test.network/ext/bc/C/rpc/" })).withTokenOptions(opts)
// }

export const Avalanche: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundEth({name: "avalanche", ticker: "AVAX", providerUrl: "https://api.avax-test.network/ext/bc/C/rpc/" })


// export function BaseEthBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "base-eth", ticker: "ETH", providerUrl: "https://mainnet.base.org/" })).withTokenOptions(opts)
// }
export const BaseEth: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundEth({name: "base-eth", ticker: "ETH", providerUrl: "https://mainnet.base.org/" })


// export function USDCEthBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundERC20({name: "usdc-eth", ticker: "USDC", providerUrl: "https://cloudflare-eth.com/", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" })).withTokenOptions(opts)
// }
export const USDCEth: Constructable<[TokenConfigTrimmed], BaseERC20Token> = getBoundERC20({name: "usdc-eth", ticker: "USDC", providerUrl: "https://cloudflare-eth.com/", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" })

// export function ArbitrumBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "arbitrum", ticker: "ETH", providerUrl:"https://arb1.arbitrum.io/rpc/" })).withTokenOptions(opts)
// }
export const Arbitrum: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundEth({name: "arbitrum", ticker: "ETH", providerUrl:"https://arb1.arbitrum.io/rpc/" })

// export function ChainlinkBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundERC20({name: "chainlink", ticker: "LINK", providerUrl: "https://main-light.eth.linkpool.io/", contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA" })).withTokenOptions(opts)
// }
export const Chainlink: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundERC20({name: "chainlink", ticker: "LINK", providerUrl: "https://main-light.eth.linkpool.io/", contractAddress: "0x514910771AF9Ca656af840dff83E8264EcF986CA" })

// export function USDCPolygonBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundERC20({name: "usdc-polygon", ticker: "USDC", providerUrl:"https://polygon-rpc.com", contractAddress:"0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" })).withTokenOptions(opts)
// }
export const USDCPolygon: Constructable<[TokenConfigTrimmed], BaseERC20Token> = getBoundERC20({name: "usdc-polygon", ticker: "USDC", providerUrl:"https://polygon-rpc.com", contractAddress:"0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" })

// export function BeraBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "bera", ticker: "BERA", providerUrl:"https://bartio.rpc.berachain.com/" })).withTokenOptions(opts)
// }
export const Bera: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundEth({name: "bera", ticker: "BERA", providerUrl:"https://bartio.rpc.berachain.com/" })

// export function ScrollEthBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "scroll-eth", ticker: "ETH", providerUrl:"https://rpc.scroll.io" })).withTokenOptions(opts)
// }
export const ScrollEth: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundEth({name: "scroll-eth", ticker: "ETH", providerUrl:"https://rpc.scroll.io" })

// export function LineaEthBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "linea-eth", ticker: "ETH", providerUrl:"https://rpc.linea.build" })).withTokenOptions(opts)
// }
export const LineaEth: Constructable<[TokenConfigTrimmed], BaseEthereumToken> =getBoundEth({name: "linea-eth", ticker: "ETH", providerUrl:"https://rpc.linea.build" })
// export function IotexBundlerIrys(opts?: EthereumTokenOpts) {
//     return new Builder(getBoundEth({name: "iotex", ticker: "IOTX", providerUrl:"https://babel-api.mainnet.iotex.io/" })).withTokenOptions(opts)
// }
export const Iotex: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = getBoundEth({name: "iotex", ticker: "IOTX", providerUrl:"https://babel-api.mainnet.iotex.io/" })

// export function EthereumBundlerIrys(opts?: EthereumTokenOpts) {
//     // return a builder
//     return new Builder(EthereumToken).withTokenOptions(opts)
// }
export const Ethereum: Constructable<[TokenConfigTrimmed], BaseEthereumToken> = EthereumToken
export default Ethereum 
// export default EthereumBundlerIrys