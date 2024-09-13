import Aptos from "@irys/upload-aptos";
import Ethereum, { Arbitrum, Avalanche, BaseEth, Bera, BNB, Chainlink, Iotex, LineaEth, Matic, ScrollEth, USDCEth, USDCPolygon } from "@irys/upload-ethereum";
import Solana, { USDCSolana } from "@irys/upload-solana";
import { Constructable, TokenConfigTrimmed } from "@irys/upload/builder";
import { BaseNodeToken } from "@irys/upload/tokens/base";

export  function getToken(token: string): Constructable<[TokenConfigTrimmed], BaseNodeToken> {
    switch (token) {
    case "ethereum": return Ethereum
    case "matic": return Matic
    case "bnb": return BNB
    case "solana": return Solana
    case "avalanche": return Avalanche
    case "base-eth": return BaseEth
    case "usdc-eth": return USDCEth
    case "arbitrum": return Arbitrum
    case "chainlink": return Chainlink
    case "aptos": return Aptos
    case "usdc-polygon": return USDCPolygon
    case "bera": return Bera
    case "scroll-eth": return ScrollEth
    case "linea-eth": return LineaEth
    case "iotex": return Iotex
    case "usdc-solana": return USDCSolana
    default:
        throw new Error(`Unknown/Unsupported token ${token}`)
    }
}