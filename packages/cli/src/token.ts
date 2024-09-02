import AptosBundlerIrys from "@irys-network/bundler-aptos";
import Builder from "@irys-network/bundler-client";
import EthereumBundlerIrys, { ArbitrumBundlerIrys, AvalancheBundlerIrys, BaseEthBundlerIrys, BeraBundlerIrys, BNBBundlerIrys, ChainlinkBundlerIrys, IotexBundlerIrys, LineaEthBundlerIrys, MaticBundlerIrys, ScrollEthBundlerIrys, USDCEthBundlerIrys, USDCPolygonBundlerIrys } from "@irys-network/bundler-ethereum";
import SolanaBundlerIrys from "@irys-network/bundler-solana";

export  function getToken(token: string): (...args: any[]) => Builder {
    switch (token) {
    case "ethereum": return EthereumBundlerIrys
    case "matic": return MaticBundlerIrys
    case "bnb": return BNBBundlerIrys
    case "solana": return SolanaBundlerIrys
    case "avalanche": return AvalancheBundlerIrys
    case "base-eth": return BaseEthBundlerIrys
    case "usdc-eth": return USDCEthBundlerIrys
    case "arbitrum": return ArbitrumBundlerIrys
    case "chainlink": return ChainlinkBundlerIrys
    case "aptos": return AptosBundlerIrys
    case "usdc-polygon": return USDCPolygonBundlerIrys
    case "bera": return BeraBundlerIrys
    case "scroll-eth": return ScrollEthBundlerIrys
    case "linea-eth": return LineaEthBundlerIrys
    case "iotex": return IotexBundlerIrys
    default:
        throw new Error(`Unknown/Unsupported token ${token}`)
    }
}